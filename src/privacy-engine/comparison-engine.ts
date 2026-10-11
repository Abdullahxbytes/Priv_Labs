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
  access_fine_location: "location", access_coarse_location: "location", approximate_location: "location", approximate_location_network_based: "location", precise_location: "location", precise_location_gps_and_network_based: "location", location: "location", geolocation: "location",
  read_contacts: "contacts", contacts: "contacts", address_book: "contacts",
  camera: "camera", take_pictures: "camera", take_pictures_and_videos: "camera", microphone: "microphone", record_audio: "microphone", voice_or_sound_recordings: "microphone",
  photos: "photos", pictures: "photos", messages: "messages", sms: "messages",
  financial_information: "financial_information", purchase_history: "financial_information", health_information: "health_information",
  device_identifiers: "device_identifiers", device_or_other_ids: "device_identifiers", advertising_id: "device_identifiers",
};

export function normalizePrivacyCategory(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = value.toLowerCase().trim().replace(/^android\.permission\./, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return CATEGORY_ALIASES[key] ?? null;
}

function sourceReady(status: SourceAvailability): boolean {
  return status === "available" || status === "cached";
}

function findingType(permission: boolean, dataSafety: boolean): ComparisonFinding["type"] {
  if (permission && !dataSafety) return "PERMISSION_DISCLOSURE_MISMATCH";
  return "DATA_SAFETY_POLICY_MISMATCH";
}

export function comparePrivacySources(input: ComparisonInput): ComparisonFinding[] {
  const requiredSources: ComparisonSource[] = ["permissions", "dataSafety", "privacyPolicy"];
  const missingSources = requiredSources.filter((source) => !sourceReady(input.sourceStatus[source]));

  if (missingSources.length > 0) {
    const labels: Record<ComparisonSource, string> = {
      permissions: "permissions",
      dataSafety: "Google Play Data Safety",
      privacyPolicy: "privacy policy analysis",
    };
    const unavailable = missingSources.map((source) => labels[source]).join(", ");
    return [{
      id: "comparison-incomplete-coverage",
      type: "INSUFFICIENT_INFORMATION",
      severity: null,
      title: "Comparison coverage incomplete",
      explanation: `A complete comparison was not possible because ${unavailable} was unavailable. Missing information is treated as unknown.`,
      sources: missingSources,
      evidenceIds: [],
      status: "insufficient_information",
    }];
  }

  const categories = new Set<string>();
  const addCategory = (value: string | null | undefined) => {
    const category = normalizePrivacyCategory(value);
    if (category) categories.add(category);
  };
  for (const permission of input.permissions) addCategory(permission.category ?? permission.name);
  for (const item of input.dataSafety?.collected ?? []) addCategory(item.type);
  for (const item of input.policyAnalysis?.dataCollected ?? []) addCategory(item.type);
  for (const item of input.policyAnalysis?.dataShared ?? []) addCategory(item.type);

  const findings: ComparisonFinding[] = [];
  for (const category of [...categories].sort()) {
    const permission = input.permissions.some((item) => normalizePrivacyCategory(item.category ?? item.name) === category);
    const dataSafety = (input.dataSafety?.collected ?? []).some((item) => normalizePrivacyCategory(item.type) === category);
    const policyItems = [...(input.policyAnalysis?.dataCollected ?? []), ...(input.policyAnalysis?.dataShared ?? [])]
      .filter((item) => normalizePrivacyCategory(item.type) === category);
    const policy = policyItems.some((item) => item.status === "found");
    const policyUnclear = policyItems.some((item) => item.status === "unclear");
    let status: ComparisonStatus;
    let type: ComparisonFinding["type"];
    let title: string;
    let explanation: string;
    if (policyUnclear) {
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
