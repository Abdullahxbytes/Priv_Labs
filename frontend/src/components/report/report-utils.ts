import type { PrivacyReport } from "@/lib/report";

export const sourceLabels = {
  permissions: "Phone access",
  dataSafety: "Google Play answers",
  privacyPolicy: "Privacy policy",
  aiAnalysis: "Policy review",
} as const;

export type SourceName = keyof typeof sourceLabels;
export type SourceState = PrivacyReport["sourceStatus"][SourceName];
export type Finding = PrivacyReport["mismatches"][number];

const friendlyNames: Record<string, string> = {
  app_activity: "App activity",
  app_interactions: "App interactions",
  crash_logs: "Crash logs",
  device_identifiers: "Device identifiers",
  financial_information: "Financial information",
  health_information: "Health information",
  precise_location: "Precise location",
  approximate_location: "Approximate location",
  full_network_access: "Network access",
};

export function humanize(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return (
    friendlyNames[normalized] ??
    normalized.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function findingSubject(item: Finding): string {
  const fromId = item.id.replace(/^comparison-/, "").replace(/^selective-/, "");
  if (fromId && fromId !== item.id) return humanize(fromId);

  const fromTitle = item.title.replace(
    /\s+(comparison\s+)?(incomplete|unavailable|unclear|mismatch|does not match).*$/i,
    "",
  );
  if (fromTitle && fromTitle !== item.title) return humanize(fromTitle);
  if (/^(incomplete|unavailable|unclear|missing|comparison)\b/i.test(item.title)) {
    return "This information";
  }

  return humanize(item.title.split(" ")[0] ?? "this data");
}

export function plainFinding(item: Finding): { title: string; explanation: string } {
  const subject = findingSubject(item);
  if (item.type === "PERMISSION_DISCLOSURE_MISMATCH") {
    return {
      title: `${subject} access is not clearly explained`,
      explanation: `The app asks for ${subject.toLowerCase()} access, but its public information does not clearly explain why.`,
    };
  }
  if (item.type === "DATA_SAFETY_POLICY_MISMATCH") {
    return {
      title: `${subject} details do not match`,
      explanation: `Google Play and the privacy policy say different things about ${subject.toLowerCase()}.`,
    };
  }
  if (item.type === "UNCLEAR_DISCLOSURE") {
    return {
      title: `${subject} details are unclear`,
      explanation: `The privacy policy does not clearly explain how ${subject.toLowerCase()} is handled.`,
    };
  }
  return {
    title: `${subject} could not be checked`,
    explanation: `Some information was missing, so we could not compare the app's statements about ${subject.toLowerCase()}.`,
  };
}

export function isReady(state: SourceState): boolean {
  return state === "available" || state === "cached";
}
