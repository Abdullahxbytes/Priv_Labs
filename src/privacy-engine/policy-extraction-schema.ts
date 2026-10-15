import { z } from "zod";

export const extractionStatusSchema = z.enum(["found", "not_found", "unclear"]);

const evidenceText = z.string().nullish().transform((value) => value ?? null);
function extractNestedText(value: unknown, depth = 0): string | undefined {
  if (typeof value === "string" && !["found", "not_found", "unclear"].includes(value)) return value;
  if (!value || typeof value !== "object" || depth > 2) return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ["purpose", "recipient", "name", "type", "value", "description", "label"]) {
    const text = extractNestedText(record[key], depth + 1);
    if (text) return text;
  }
  for (const [key, nested] of Object.entries(record)) {
    if (["status", "evidence"].includes(key)) continue;
    const text = extractNestedText(nested, depth + 1);
    if (text) return text;
  }
  return undefined;
}

const normalizedText = z.preprocess((value) => {
  return extractNestedText(value) ?? value;
}, z.string());

function normalizeTypedRecord(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  if (typeof record.type === "string") return record;
  for (const key of ["category", "name", "label", "dataType", "practice", "measure"]) {
    if (typeof record[key] === "string") return { ...record, type: record[key] };
  }
  const entries = Object.entries(record).filter(([key]) => !["status", "evidence", "purposes", "recipients"].includes(key));
  if (entries.length === 1) {
    const [type, nested] = entries[0]!;
    return nested && typeof nested === "object" && !Array.isArray(nested)
      ? { ...(nested as Record<string, unknown>), type }
      : { ...record, type };
  }
  return record;
}

export const privacyExtractionSchema = z.object({
  dataCollected: z.array(z.preprocess(normalizeTypedRecord, z.object({
    type: z.string(),
    status: extractionStatusSchema,
    purposes: z.array(normalizedText).default([]),
    evidence: evidenceText,
  }))).default([]),
  dataShared: z.array(z.preprocess(normalizeTypedRecord, z.object({
    type: z.string(),
    status: extractionStatusSchema,
    recipients: z.array(normalizedText).default([]),
    purposes: z.array(normalizedText).default([]),
    evidence: evidenceText,
  }))).default([]),
  thirdParties: z.array(normalizedText).default([]),
  retention: z.object({
    status: extractionStatusSchema,
    details: z.string().nullish().transform((value) => value ?? null),
    evidence: evidenceText,
  }).default({ status: "not_found", details: null, evidence: null }),
  deletion: z.object({
    status: extractionStatusSchema,
    details: z.string().nullish().transform((value) => value ?? null),
    evidence: evidenceText,
  }).default({ status: "not_found", details: null, evidence: null }),
  security: z.array(z.preprocess(normalizeTypedRecord, z.object({
    type: z.string(),
    status: extractionStatusSchema,
    evidence: evidenceText,
  }))).default([]),
});

export type PrivacyExtraction = z.infer<typeof privacyExtractionSchema>;
