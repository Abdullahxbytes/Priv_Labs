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
    throw new PrivacyPolicyAnalysisError("Groq returned JSON with an invalid shape.");
  }
  return result.data;
}

export async function analyzePrivacyPolicy(policyText: string): Promise<PrivacyExtraction> {
  if (!policyText.trim()) {
    throw new PrivacyPolicyAnalysisError("policy text must not be empty.");
  }

  const prompt = buildPolicyExtractionPrompt(policyText);
  try {
    return parseAndValidate(await callGroq(prompt));
  } catch (firstError) {
    try {
      return parseAndValidate(await callGroq(`${prompt}\n\n${STRICT_JSON_RETRY}`));
    } catch {
      if (firstError instanceof PrivacyPolicyAnalysisError) throw firstError;
      throw new PrivacyPolicyAnalysisError("Groq request could not be validated.");
    }
  }
}
