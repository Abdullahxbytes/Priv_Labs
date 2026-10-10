import { comparePrivacySources } from "../src/privacy-engine/comparison-engine.js";
import type { PrivacyExtraction } from "../src/privacy-engine/policy-extraction-schema.js";

const statuses = { permissions: "available", dataSafety: "available", privacyPolicy: "available" } as const;
const policy = (type: string, status: "found" | "not_found" | "unclear" = "found") => ({ type, status, purposes: [], recipients: [], evidence: null });
const emptyPolicy: PrivacyExtraction = { dataCollected: [], dataShared: [], thirdParties: [], retention: { status: "unclear", details: null, evidence: null }, deletion: { status: "unclear", details: null, evidence: null }, security: [] };

const common = { permissions: [{ raw: "ACCESS_FINE_LOCATION", name: "Precise Location", category: "location" }], dataSafety: { collected: [{ type: "location" }] }, policyAnalysis: { ...emptyPolicy, dataCollected: [policy("location")] }, sourceStatus: statuses };
if (comparePrivacySources(common).find((f) => f.id === "comparison-location")?.status !== "consistent") throw new Error("agreement case failed");
const permissionGap = comparePrivacySources({ ...common, permissions: [{ raw: "READ_CONTACTS", name: "Contacts", category: "contacts" }], dataSafety: { collected: [] }, policyAnalysis: { ...emptyPolicy } });
if (permissionGap.find((f) => f.id === "comparison-contacts")?.status !== "possible_mismatch") throw new Error("permission disclosure case failed");
const policyMismatch = comparePrivacySources({ ...common, permissions: [], dataSafety: { collected: [] }, policyAnalysis: { ...emptyPolicy, dataShared: [policy("device_identifiers")] } });
if (policyMismatch.find((f) => f.id === "comparison-device_identifiers")?.status !== "possible_mismatch") throw new Error("policy mismatch case failed");
const incomplete = comparePrivacySources({ ...common, sourceStatus: { ...statuses, dataSafety: "failed" } });
if (incomplete.some((f) => f.status === "possible_mismatch")) throw new Error("missing source created false mismatch");
console.log("Comparison smoke test passed.");
