import { callGroq } from "./groq-client.js";
import {
  buildPolicyExtractionPrompt,
  STRICT_JSON_RETRY,
} from "./policy-extraction-prompt.js";
import {
  privacyExtractionSchema,
  type PrivacyExtraction,
} from "./policy-extraction-schema.js";

export class PrivacyPolicyAnalysisError extends Error {
  constructor(message: string) {
    super(`Privacy-policy analysis failed: ${message}`);
    this.name = "PrivacyPolicyAnalysisError";
  }
}

function parseAndValidate(raw: string): PrivacyExtraction {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new PrivacyPolicyAnalysisError("Groq returned invalid JSON.");
  }

  const result = privacyExtractionSchema.safeParse(parsed);
  if (!result.success) {
    const details = result.error.issues.slice(0, 5).map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`).join("; ");
    throw new PrivacyPolicyAnalysisError(`Groq returned JSON with an invalid shape (${details}).`);
  }
  return result.data;
}

const MAX_CHUNK_CHARACTERS = 18_000;
const CHUNK_CONCURRENCY = 2;
const MAX_EXTRACTION_TOKENS = 2_000;
const PRIVACY_KEYWORDS = /collect|share|third part|partner|advertis|track|location|contact|camera|microphone|photo|message|financial|health|identifier|device|retain|retention|delet|security|encrypt/gi;

export function policyTextRequiresSampling(policyText: string): boolean {
  return policyText.trim().length > MAX_CHUNK_CHARACTERS;
}

function selectRelevantPolicyText(policyText: string): string {
  if (!policyTextRequiresSampling(policyText)) return policyText;

  const ranges: Array<{ start: number; end: number }> = [
    { start: 0, end: 2_500 },
    { start: Math.max(0, policyText.length - 2_500), end: policyText.length },
  ];
  for (const match of policyText.matchAll(PRIVACY_KEYWORDS)) {
    const index = match.index ?? 0;
    ranges.push({ start: Math.max(0, index - 450), end: Math.min(policyText.length, index + 950) });
  }

  ranges.sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  }

  const excerpts: string[] = [];
  let remaining = MAX_CHUNK_CHARACTERS;
  for (const range of merged) {
    if (remaining <= 0) break;
    const excerpt = policyText.slice(range.start, range.end).trim().slice(0, remaining);
    if (excerpt) {
      excerpts.push(excerpt);
      remaining -= excerpt.length + 2;
    }
  }
  return excerpts.join("\n\n");
}

function splitLongBlock(block: string): string[] {
  const parts: string[] = [];
  let remaining = block.trim();
  while (remaining.length > MAX_CHUNK_CHARACTERS) {
    const window = remaining.slice(0, MAX_CHUNK_CHARACTERS);
    const sentenceBreak = Math.max(window.lastIndexOf(". "), window.lastIndexOf("; "), window.lastIndexOf(" "));
    const splitAt = sentenceBreak >= MAX_CHUNK_CHARACTERS * 0.6 ? sentenceBreak + 1 : MAX_CHUNK_CHARACTERS;
    parts.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

function splitPolicyText(policyText: string): string[] {
  const chunks: string[] = [];
  let current = "";
  const blocks = policyText.split(/\n+/).flatMap(splitLongBlock).filter(Boolean);

  for (const block of blocks) {
    const candidate = current ? `${current}\n${block}` : block;
    if (candidate.length <= MAX_CHUNK_CHARACTERS) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    current = block;
  }
  if (current) chunks.push(current);
  return chunks;
}

async function analyzeChunk(policyText: string, index: number, total: number): Promise<PrivacyExtraction> {
  const prompt = `${buildPolicyExtractionPrompt(policyText)}\n\nThis is section ${index + 1} of ${total}. A not_found status applies only to this inspected section.`;
  try {
    return parseAndValidate(await callGroq(prompt, { json: true, maxTokens: MAX_EXTRACTION_TOKENS }));
  } catch (firstError) {
    try {
      return parseAndValidate(await callGroq(`${prompt}\n\n${STRICT_JSON_RETRY}`, { json: true, maxTokens: MAX_EXTRACTION_TOKENS }));
    } catch {
      if (firstError instanceof PrivacyPolicyAnalysisError) throw firstError;
      throw new PrivacyPolicyAnalysisError(firstError instanceof Error ? firstError.message : "Groq request could not be validated.");
    }
  }
}

const statusPriority = { not_found: 0, unclear: 1, found: 2 } as const;
type ExtractionStatus = keyof typeof statusPriority;

function bestStatus(items: Array<{ status: ExtractionStatus }>): ExtractionStatus {
  let best: ExtractionStatus = "not_found";
  for (const item of items) {
    if (statusPriority[item.status] > statusPriority[best]) best = item.status;
  }
  return best;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function mergeExtractions(extractions: PrivacyExtraction[]): PrivacyExtraction {
  const collectedGroups = new Map<string, PrivacyExtraction["dataCollected"]>();
  const sharedGroups = new Map<string, PrivacyExtraction["dataShared"]>();
  const securityGroups = new Map<string, PrivacyExtraction["security"]>();

  for (const extraction of extractions) {
    for (const item of extraction.dataCollected) {
      const key = item.type.trim().toLowerCase();
      collectedGroups.set(key, [...(collectedGroups.get(key) ?? []), item]);
    }
    for (const item of extraction.dataShared) {
      const key = item.type.trim().toLowerCase();
      sharedGroups.set(key, [...(sharedGroups.get(key) ?? []), item]);
    }
    for (const item of extraction.security) {
      const key = item.type.trim().toLowerCase();
      securityGroups.set(key, [...(securityGroups.get(key) ?? []), item]);
    }
  }

  const dataCollected = [...collectedGroups.values()].map((items) => {
    const status = bestStatus(items);
    const preferred = items.find((item) => item.status === status && item.evidence) ?? items.find((item) => item.status === status) ?? items[0]!;
    return { type: preferred.type, status, purposes: unique(items.flatMap((item) => item.purposes)), evidence: preferred.evidence };
  });
  const dataShared = [...sharedGroups.values()].map((items) => {
    const status = bestStatus(items);
    const preferred = items.find((item) => item.status === status && item.evidence) ?? items.find((item) => item.status === status) ?? items[0]!;
    return { type: preferred.type, status, recipients: unique(items.flatMap((item) => item.recipients)), purposes: unique(items.flatMap((item) => item.purposes)), evidence: preferred.evidence };
  });
  const security = [...securityGroups.values()].map((items) => {
    const status = bestStatus(items);
    const preferred = items.find((item) => item.status === status && item.evidence) ?? items.find((item) => item.status === status) ?? items[0]!;
    return { type: preferred.type, status, evidence: preferred.evidence };
  });

  function mergeDetail(key: "retention" | "deletion") {
    const items = extractions.map((item) => item[key]);
    const status = bestStatus(items);
    const preferred = items.find((item) => item.status === status && (item.evidence || item.details)) ?? items.find((item) => item.status === status) ?? items[0]!;
    return { status, details: preferred.details, evidence: preferred.evidence };
  }

  return {
    dataCollected,
    dataShared,
    thirdParties: unique(extractions.flatMap((item) => item.thirdParties)),
    retention: mergeDetail("retention"),
    deletion: mergeDetail("deletion"),
    security,
  };
}

export async function analyzePrivacyPolicy(policyText: string): Promise<PrivacyExtraction> {
  const normalized = policyText.trim();
  if (!normalized) throw new PrivacyPolicyAnalysisError("policy text must not be empty.");

  const chunks = splitPolicyText(selectRelevantPolicyText(normalized));
  const extractions: PrivacyExtraction[] = [];
  for (let index = 0; index < chunks.length; index += CHUNK_CONCURRENCY) {
    const batch = chunks.slice(index, index + CHUNK_CONCURRENCY);
    extractions.push(...await Promise.all(batch.map((chunk, offset) => analyzeChunk(chunk, index + offset, chunks.length))));
  }
  return mergeExtractions(extractions);
}
