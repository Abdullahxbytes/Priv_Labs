import { z } from "zod";

const status = z.enum(["available", "cached", "failed", "unavailable"]);
const findingStatus = z.enum(["found", "not_found", "unclear"]);
const risk = z.enum(["LOW", "MODERATE", "HIGH", "VERY HIGH"]);
const source = z.enum(["permissions", "dataSafety", "privacyPolicy"]);
const finding = z.object({
  id: z.string(),
  title: z.string(),
  explanation: z.string(),
  evidenceIds: z.array(z.string()),
});
const collection = z.object({
  type: z.string(),
  label: z.string(),
  purposes: z.array(z.string()),
  source: z.array(z.enum(["dataSafety", "privacyPolicy"])).min(1),
  status: findingStatus,
});
export const reportSchema = z
  .object({
    app: z.object({
      appId: z.string().min(1),
      name: z.string().min(1),
      developer: z.string().nullable(),
      icon: z.string().nullable(),
      rating: z.number().nullable(),
      category: z.string().nullable(),
      storeUrl: z.string().nullable(),
    }),
    score: z.number().min(0).max(100),
    riskLevel: risk,
    sourceStatus: z.object({
      permissions: status,
      dataSafety: status,
      privacyPolicy: status,
      aiAnalysis: status,
    }),
    permissions: z.array(
      z.object({
        raw: z.string().nullable(),
        name: z.string(),
        category: z.string().nullable(),
        risk: risk.nullable(),
        expected: z.boolean().nullable(),
        explanation: z.string(),
      }),
    ),
    dataCollected: z.array(collection),
    dataShared: z.array(collection.extend({ recipients: z.array(z.string()) })),
    mismatches: z.array(
      finding.extend({
        type: z.enum([
          "PERMISSION_DISCLOSURE_MISMATCH",
          "DATA_SAFETY_POLICY_MISMATCH",
          "UNCLEAR_DISCLOSURE",
          "INSUFFICIENT_INFORMATION",
        ]),
        severity: risk.nullable(),
        sources: z.array(source),
      }),
    ),
    positiveFindings: z.array(finding),
    summary: z.array(z.string()),
    evidence: z.array(
      z.object({
        id: z.string(),
        source,
        category: z.string(),
        status: findingStatus,
        excerpt: z.string().nullable(),
        sourceUrl: z.string().nullable(),
      }),
    ),
  })
  .superRefine((report, ctx) => {
    const ids = new Set(report.evidence.map((item) => item.id));
    if (
      ids.size !== report.evidence.length ||
      [...report.mismatches, ...report.positiveFindings].some((item) =>
        item.evidenceIds.some((id) => !ids.has(id)),
      )
    ) {
      ctx.addIssue({ code: "custom", message: "Invalid evidence references" });
    }
  });
export type PrivacyReport = z.infer<typeof reportSchema>;
export function safeLink(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
