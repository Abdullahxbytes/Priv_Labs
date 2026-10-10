import { z } from "zod";

export const extractionStatusSchema = z.enum(["found", "not_found", "unclear"]);

const evidenceText = z.string().nullable();

export const privacyExtractionSchema = z.object({
  dataCollected: z.array(z.object({
    type: z.string(),
    status: extractionStatusSchema,
    purposes: z.array(z.string()),
    evidence: evidenceText,
  })),
  dataShared: z.array(z.object({
    type: z.string(),
    status: extractionStatusSchema,
    recipients: z.array(z.string()),
    purposes: z.array(z.string()),
    evidence: evidenceText,
  })),
  thirdParties: z.array(z.string()),
  retention: z.object({
    status: extractionStatusSchema,
    details: z.string().nullable(),
    evidence: evidenceText,
  }),
  deletion: z.object({
    status: extractionStatusSchema,
    details: z.string().nullable(),
    evidence: evidenceText,
  }),
  security: z.array(z.object({
    type: z.string(),
    status: extractionStatusSchema,
    evidence: evidenceText,
  })),
});

export type PrivacyExtraction = z.infer<typeof privacyExtractionSchema>;
