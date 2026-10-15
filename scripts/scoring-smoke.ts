import type { ComparisonFinding } from "../src/privacy-engine/comparison-engine.js";
import { calculatePrivacyScore } from "../src/privacy-engine/scoring.js";
import type { PrivacyExtraction } from "../src/privacy-engine/policy-extraction-schema.js";

const sourceStatus = {
  permissions: "available",
  dataSafety: "available",
  privacyPolicy: "available",
  aiAnalysis: "available",
} as const;

const emptyPolicy: PrivacyExtraction = {
  dataCollected: [],
  dataShared: [],
  thirdParties: [],
  retention: { status: "unclear", details: null, evidence: null },
  deletion: { status: "unclear", details: null, evidence: null },
  security: [],
};

const insufficient: ComparisonFinding = {
  id: "comparison-location",
  type: "INSUFFICIENT_INFORMATION",
  severity: null,
  title: "location comparison incomplete",
  explanation: "A source was unavailable.",
  sources: ["permissions", "dataSafety", "privacyPolicy"],
  evidenceIds: [],
  status: "insufficient_information",
};

const incomplete = calculatePrivacyScore({
  permissions: [{ raw: "CAMERA", name: "Camera", category: "camera" }],
  dataSafety: { collected: [{ type: "Personal info", label: "Email address" }] },
  policyAnalysis: null,
  sourceStatus: {
    ...sourceStatus,
    privacyPolicy: "failed",
    aiAnalysis: "unavailable",
  },
  comparisons: [insufficient],
});

if (incomplete.score >= 100) {
  throw new Error("Observed exposure incorrectly received a perfect score.");
}

const mismatch = calculatePrivacyScore({
  permissions: [{ raw: "CAMERA", name: "Camera", category: "camera" }],
  dataSafety: { collected: [] },
  policyAnalysis: emptyPolicy,
  sourceStatus,
  comparisons: [
    {
      ...insufficient,
      type: "PERMISSION_DISCLOSURE_MISMATCH",
      status: "possible_mismatch",
    },
  ],
});

if (mismatch.score >= 99) {
  throw new Error("A supported mismatch did not reduce the score.");
}

const missingOnly = calculatePrivacyScore({
  permissions: [],
  dataSafety: null,
  policyAnalysis: null,
  sourceStatus: {
    permissions: "failed",
    dataSafety: "failed",
    privacyPolicy: "failed",
    aiAnalysis: "unavailable",
  },
  comparisons: [insufficient],
});

if (missingOnly.score !== 100) {
  throw new Error("Missing sources were treated as a score penalty.");
}

console.log("Scoring smoke test passed.");
