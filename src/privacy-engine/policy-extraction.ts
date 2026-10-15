import { callGroq } from "./groq-client.js";
import {
  buildPolicyExtractionPrompt,
  STRICT_JSON_RETRY,
} from "./policy-extraction-prompt.js";
import {
  privacyExtractionSchema,
  type PrivacyExtraction,
} from "./policy-extraction-schema.js";

export const POLICY_ANALYSIS_CHAR_LIMIT = 18_000;

const POLICY_KEYWORDS =
  /collect|share|third part|advertis|location|contact|camera|microphone|photo|message|financial|health|device|identifier|retain|retention|delet|security|encrypt/gi;

export function requiresSelectivePolicyAnalysis(policyText: string): boolean {
  return policyText.length > POLICY_ANALYSIS_CHAR_LIMIT;
}

function selectPolicyExcerpts(policyText: string): string {
  if (!requiresSelectivePolicyAnalysis(policyText)) return policyText;

  const ranges: Array<{ start: number; end: number }> = [
    { start: 0, end: 4_000 },
    { start: Math.max(0, policyText.length - 2_500), end: policyText.length },
  ];

  let match: RegExpExecArray | null;
  let previousCenter = -Infinity;
  POLICY_KEYWORDS.lastIndex = 0;
  while (
    (match = POLICY_KEYWORDS.exec(policyText)) !== null &&
    ranges.length < 14
  ) {
    const center = match.index;
    if (center - previousCenter < 1_200) continue;
    ranges.push({
      start: Math.max(0, center - 600),
      end: Math.min(policyText.length, center + 1_000),
    });
    previousCenter = center;
  }

  ranges.sort((left, right) => left.start - right.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  const excerpts = merged
    .map(
      (range, index) =>
        `[Selected policy excerpt ${index + 1}]\n${policyText.slice(range.start, range.end)}`,
    )
    .join("\n\n");

  return excerpts.slice(0, POLICY_ANALYSIS_CHAR_LIMIT);
}

export class PrivacyPolicyAnalysisError extends Error {
  constructor(message: string) {
    super(`Privacy-policy analysis failed: ${message}`);
    this.name = "PrivacyPolicyAnalysisError";
  }
}

function parseAndValidate(raw: string): PrivacyExtraction {
  let parsed: unknown;
  try {
    const withoutFence = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const objectStart = withoutFence.indexOf("{");
    const objectEnd = withoutFence.lastIndexOf("}");
    const json =
      objectStart >= 0 && objectEnd > objectStart
        ? withoutFence.slice(objectStart, objectEnd + 1)
        : withoutFence;
    parsed = JSON.parse(json);
  } catch {
    throw new PrivacyPolicyAnalysisError("Groq returned invalid JSON.");
  }

  const result = privacyExtractionSchema.safeParse(parsed);
  if (!result.success) {
    throw new PrivacyPolicyAnalysisError(
      "Groq returned JSON with an invalid shape.",
    );
  }
  return result.data;
}

export async function analyzePrivacyPolicy(
  policyText: string,
): Promise<PrivacyExtraction> {
  if (!policyText.trim()) {
    throw new PrivacyPolicyAnalysisError("policy text must not be empty.");
  }

  const prompt = buildPolicyExtractionPrompt(selectPolicyExcerpts(policyText));
  try {
    return parseAndValidate(await callGroq(prompt, { json: true, maxTokens: MAX_EXTRACTION_TOKENS }));
  } catch (firstError) {
    try {
      return parseAndValidate(
        await callGroq(`${prompt}\n\n${STRICT_JSON_RETRY}`),
      );
    } catch {
      if (firstError instanceof PrivacyPolicyAnalysisError) throw firstError;
      throw new PrivacyPolicyAnalysisError(
        "Groq request could not be validated.",
      );
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
