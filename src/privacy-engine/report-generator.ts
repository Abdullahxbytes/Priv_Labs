import type { ComparisonFinding, ComparisonInput, PermissionInput } from "./comparison-engine.js";
import { calculatePrivacyScore } from "./scoring.js";
import type { PrivacyExtraction } from "./policy-extraction-schema.js";

export interface ReportInput extends ComparisonInput {
  app: object;
  comparisons: ComparisonFinding[];
  policyUrl?: string | null;
  aiAnalysisStatus?: "available" | "cached" | "failed" | "unavailable";
}

function policyEvidence(policy: PrivacyExtraction, sourceUrl: string | null) {
  const evidence: Array<{ id: string; source: "privacyPolicy"; category: string; status: "found" | "unclear"; excerpt: string; sourceUrl: string | null }> = [];
  const add = (category: string, status: "found" | "unclear", excerpt: string | null) => {
    if (excerpt) evidence.push({ id: `evidence-${evidence.length + 1}`, source: "privacyPolicy", category, status, excerpt, sourceUrl });
  };
  for (const item of policy.dataCollected) add(item.type, item.status === "unclear" ? "unclear" : "found", item.evidence);
  for (const item of policy.dataShared) add(item.type, item.status === "unclear" ? "unclear" : "found", item.evidence);
  add("deletion", policy.deletion.status === "unclear" ? "unclear" : "found", policy.deletion.evidence ?? policy.deletion.details);
  for (const item of policy.security) add(item.type, item.status === "unclear" ? "unclear" : "found", item.evidence);
  return evidence;
}

export function buildPrivacyReport(input: ReportInput) {
  const { score, riskLevel } = calculatePrivacyScore(input.comparisons);
  const evidence = input.policyAnalysis ? policyEvidence(input.policyAnalysis, input.policyUrl ?? null) : [];
  const dataCollected = input.policyAnalysis?.dataCollected.map((item) => ({ type: item.type, label: item.type, purposes: item.purposes, source: ["privacyPolicy" as const], status: item.status })) ?? [];
  const dataShared = input.policyAnalysis?.dataShared.map((item) => ({ type: item.type, label: item.type, recipients: item.recipients, purposes: item.purposes, source: ["privacyPolicy" as const], status: item.status })) ?? [];
  const permissions = input.permissions.map((permission: PermissionInput) => ({ raw: permission.raw, name: permission.name, category: permission.category ?? null, risk: null, expected: null, explanation: `This permission allows access to ${permission.category ?? permission.name}.` }));
  const usableStore = ["available", "cached"].includes(input.sourceStatus.dataSafety);
  const storeCollected = usableStore ? (input.dataSafety?.collected ?? []).map(item => ({ type: item.type, label: item.label ?? item.type, purposes: item.purposes ?? [], source: ["dataSafety"], status: "found" })) : [];
  const storeShared = usableStore ? (input.dataSafety?.shared ?? []).map(item => ({ type: item.type, label: item.label ?? item.type, purposes: item.purposes ?? [], recipients: item.recipients ?? [], source: ["dataSafety"], status: "found" })) : [];
  const positiveFindings = input.policyAnalysis?.deletion.status === "found" ? [{ id: "positive-deletion", title: "Data deletion available", explanation: "The privacy policy describes a data deletion option.", evidenceIds: evidence.filter((item) => item.category === "deletion").map((item) => item.id) }] : [];
  const mismatches = input.comparisons.filter((finding) => finding.status !== "consistent").map(({ status: _status, ...finding }) => finding);
  const summary = input.comparisons
    .filter((finding) => finding.status === "possible_mismatch")
    .slice(0, 3)
    .map((finding) => finding.title);
  const incomplete = input.comparisons.some((finding) => finding.status === "insufficient_information");
  if (incomplete) summary.push("The comparison was limited because one or more required sources were unavailable.");
  if (summary.length === 0) summary.push("No possible disclosure mismatch was identified in the available sources.");
  return { app: input.app, score, riskLevel, sourceStatus: { ...input.sourceStatus, aiAnalysis: input.aiAnalysisStatus ?? (input.policyAnalysis ? "available" : "unavailable") }, permissions, dataCollected: [...storeCollected, ...dataCollected], dataShared: [...storeShared, ...dataShared], mismatches, positiveFindings, summary, evidence };
}
