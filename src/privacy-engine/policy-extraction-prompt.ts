export function buildPolicyExtractionPrompt(policyText: string): string {
  return `You extract privacy facts from the supplied privacy-policy text only.

Return JSON only, matching this exact shape:
{
  "dataCollected": [{"type":"location","status":"found|not_found|unclear","purposes":[],"evidence":null}],
  "dataShared": [{"type":"device_identifiers","status":"found|not_found|unclear","recipients":[],"purposes":[],"evidence":null}],
  "thirdParties": [],
  "retention": {"status":"found|not_found|unclear","details":null,"evidence":null},
  "deletion": {"status":"found|not_found|unclear","details":null,"evidence":null},
  "security": [{"type":"encryption","status":"found|not_found|unclear","evidence":null}]
}

Rules:
- Use only the supplied policy text.
- Use only found, not_found, or unclear for statuses.
- not_found means the information was not found in the inspected text; it does not prove the practice does not exist.
- In array fields, include only items that are found or unclear in the inspected text. Use an empty array when there are no supported items.
- Keep the response compact: at most 12 objects across all array fields, at most 4 purposes or recipients per object, and no duplicate categories.
- Include faithful evidence excerpts of at most 160 characters where possible; otherwise use null.
- Do not invent facts, make legal conclusions, accuse the company, compare permissions or Data Safety, or calculate a score.
- Return no markdown and no explanation outside the JSON object.

<privacy-policy>
${policyText}
</privacy-policy>`;
}

export const STRICT_JSON_RETRY =
  "Return only one valid JSON object matching the requested schema. Do not include markdown fences or any text outside the JSON.";
