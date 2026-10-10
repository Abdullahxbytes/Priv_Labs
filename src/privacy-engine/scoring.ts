import type { ComparisonFinding } from "./comparison-engine.js";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "VERY HIGH";

export interface ScoreResult { score: number; riskLevel: RiskLevel; }

export function calculatePrivacyScore(findings: ComparisonFinding[]): ScoreResult {
  let score = 100;
  for (const finding of findings) {
    if (finding.status === "possible_mismatch") score -= 15;
    if (finding.status === "unclear") score -= 5;
  }
  score = Math.max(0, Math.min(100, score));
  const riskLevel: RiskLevel = score >= 80 ? "LOW" : score >= 60 ? "MODERATE" : score >= 40 ? "HIGH" : "VERY HIGH";
  return { score, riskLevel };
}
