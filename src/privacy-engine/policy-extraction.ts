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
    return parseAndValidate(await callGroq(prompt));
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
