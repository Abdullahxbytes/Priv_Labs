import type {
  ComparisonFinding,
  ComparisonInput,
} from "./comparison-engine.js";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "VERY HIGH";

export interface ScoreResult {
  score: number;
  riskLevel: RiskLevel;
}

export interface PrivacyScoreInput extends ComparisonInput {
  comparisons: ComparisonFinding[];
}

function scoreKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return key || null;
}

function uniqueCount(values: Array<string | null | undefined>): number {
  return new Set(
    values.map(scoreKey).filter((value): value is string => Boolean(value)),
  ).size;
}

function riskLevelFor(score: number): RiskLevel {
  if (score >= 80) return "LOW";
  if (score >= 60) return "MODERATE";
  if (score >= 40) return "HIGH";
  return "VERY HIGH";
}

export function calculatePrivacyScore(input: PrivacyScoreInput): ScoreResult {
  let score = 100;

  const permissionGroups = uniqueCount(
    input.permissions.map((permission) => permission.category ?? permission.name),
  );
  const collectedGroups = uniqueCount([
    ...(input.dataSafety?.collected.map((item) => item.type) ?? []),
    ...(input.policyAnalysis?.dataCollected
      .filter((item) => item.status === "found")
      .map((item) => item.type) ?? []),
  ]);
  const sharedGroups = uniqueCount([
    ...(input.dataSafety?.shared?.map((item) => item.type) ?? []),
    ...(input.policyAnalysis?.dataShared
      .filter((item) => item.status === "found")
      .map((item) => item.type) ?? []),
  ]);
  const mismatchCount = input.comparisons.filter(
    (finding) => finding.status === "possible_mismatch",
  ).length;
  const unclearCount = input.comparisons.filter(
    (finding) => finding.status === "unclear",
  ).length;

  score -= Math.min(permissionGroups, 10);
  score -= Math.min(collectedGroups * 3, 24);
  score -= Math.min(sharedGroups * 5, 25);
  score -= Math.min(mismatchCount * 6, 30);
  score -= Math.min(unclearCount * 3, 12);

  if (input.policyAnalysis?.deletion.status === "found") score += 4;
  const supportedSecurityPractices =
    input.policyAnalysis?.security.filter((item) => item.status === "found").length ?? 0;
  score += Math.min(supportedSecurityPractices * 2, 4);

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  return { score: boundedScore, riskLevel: riskLevelFor(boundedScore) };
}
