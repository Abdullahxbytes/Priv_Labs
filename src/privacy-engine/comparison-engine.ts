import type { PrivacyExtraction } from "./policy-extraction-schema.js";

export type ComparisonStatus =
  | "consistent"
  | "possible_mismatch"
  | "unclear"
  | "insufficient_information";

export type ComparisonSource = "permissions" | "dataSafety" | "privacyPolicy";
export type SourceAvailability = "available" | "unavailable" | "failed" | "cached";

export interface PermissionInput {
  raw: string | null;
  name: string;
  category?: string | null;
}

export interface DataSafetyInput {
  collected: Array<{ type: string; label?: string; purposes?: string[] }>;
  shared?: Array<{ type: string; label?: string; recipients?: string[]; purposes?: string[] }>;
}

export interface ComparisonInput {
  permissions: PermissionInput[];
  dataSafety: DataSafetyInput | null;
  policyAnalysis: PrivacyExtraction | null;
  sourceStatus: Record<ComparisonSource, SourceAvailability>;
}

export interface ComparisonFinding {
  id: string;
  type: "PERMISSION_DISCLOSURE_MISMATCH" | "DATA_SAFETY_POLICY_MISMATCH" | "UNCLEAR_DISCLOSURE" | "INSUFFICIENT_INFORMATION";
  severity: null;
  title: string;
  explanation: string;
  sources: ComparisonSource[];
  evidenceIds: string[];
  status: ComparisonStatus;
}

const CATEGORY_ALIASES: Record<string, string> = {
  access_fine_location: "location", access_coarse_location: "location", location: "location", geolocation: "location",
  read_contacts: "contacts", contacts: "contacts", address_book: "contacts",
  camera: "camera", take_pictures: "camera", microphone: "microphone", record_audio: "microphone",
  photos: "photos", pictures: "photos", messages: "messages", sms: "messages",
  financial_information: "financial_information", health_information: "health_information",
  device_identifiers: "device_identifiers", advertising_id: "device_identifiers",
};

export function normalizePrivacyCategory(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = value.toLowerCase().trim().replace(/^android\.permission\./, "").replace(/[\s-]+/g, "_");
  return CATEGORY_ALIASES[key] ?? (key || null);
}

function sourceReady(status: SourceAvailability): boolean {
  return status === "available" || status === "cached";
}

function findingType(permission: boolean, dataSafety: boolean): ComparisonFinding["type"] {
  if (permission && !dataSafety) return "PERMISSION_DISCLOSURE_MISMATCH";
  return "DATA_SAFETY_POLICY_MISMATCH";
}

export function comparePrivacySources(input: ComparisonInput): ComparisonFinding[] {
  const categories = new Set<string>();
  for (const permission of input.permissions) categories.add(normalizePrivacyCategory(permission.category ?? permission.name) ?? "unknown");
  for (const item of input.dataSafety?.collected ?? []) categories.add(normalizePrivacyCategory(item.type) ?? "unknown");
  for (const item of input.policyAnalysis?.dataCollected ?? []) categories.add(normalizePrivacyCategory(item.type) ?? "unknown");
  for (const item of input.policyAnalysis?.dataShared ?? []) categories.add(normalizePrivacyCategory(item.type) ?? "unknown");

  const findings: ComparisonFinding[] = [];
  for (const category of [...categories].sort()) {
    const permission = input.permissions.some((item) => normalizePrivacyCategory(item.category ?? item.name) === category);
    const dataSafety = (input.dataSafety?.collected ?? []).some((item) => normalizePrivacyCategory(item.type) === category);
    const policyItems = [...(input.policyAnalysis?.dataCollected ?? []), ...(input.policyAnalysis?.dataShared ?? [])]
      .filter((item) => normalizePrivacyCategory(item.type) === category);
    const policy = policyItems.some((item) => item.status === "found");
    const policyUnclear = policyItems.some((item) => item.status === "unclear");
    const requiredSources: ComparisonSource[] = ["permissions", "dataSafety", "privacyPolicy"];
    const missing = requiredSources.filter((source) => !sourceReady(input.sourceStatus[source]));
    let status: ComparisonStatus;
    let type: ComparisonFinding["type"];
    let title: string;
    let explanation: string;
    if (missing.length > 0) {
      status = "insufficient_information";
      type = "INSUFFICIENT_INFORMATION";
      title = `${category} comparison incomplete`;
      explanation = `The available sources do not provide enough information to compare ${category}.`;
    } else if (policyUnclear) {
      status = "unclear";
      type = "UNCLEAR_DISCLOSURE";
      title = `${category} disclosure is unclear`;
      explanation = `The privacy policy wording for ${category} was ambiguous in the inspected content.`;
    } else if (permission && !dataSafety && !policy) {
      status = "possible_mismatch";
      type = "PERMISSION_DISCLOSURE_MISMATCH";
      title = `${category} not clearly disclosed`;
      explanation = `The app requests ${category} access, but ${category} handling was not clearly identified in available disclosures.`;
    } else if ((dataSafety && !policy) || (!dataSafety && policy)) {
      status = "possible_mismatch";
      type = findingType(permission, dataSafety);
      title = `${category} disclosures differ`;
      explanation = `The Google Play Data Safety and privacy policy disclosures for ${category} were not aligned in the inspected content.`;
    } else {
      status = "consistent";
      type = "UNCLEAR_DISCLOSURE";
      title = `${category} disclosures are consistent`;
      explanation = `The available disclosures consistently identify ${category} handling.`;
    }
    findings.push({ id: `comparison-${category}`, type, severity: null, title, explanation, sources: requiredSources, evidenceIds: [], status });
  }
  return findings;
}
