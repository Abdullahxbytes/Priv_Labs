/**
 * App Data Retrieval — metadata, permissions, and Data Safety from Google Play.
 *
 * Owns: fetching and normalizing Play Store source data.
 * Does NOT own: AI analysis, privacy scoring, mismatch judgments.
 *
 * Partial source failure must not crash the entire retrieval flow.
 * Each source is retrieved independently; failures set sourceStatus accordingly.
 */

import gplay, { IAppItemFullDetail } from "google-play-scraper";
import {
  AppMetadata,
  DataSafety,
  DataSafetyCollectedItem,
  DataSafetySharedItem,
  RetrievalSourceStatus,
  RetrievedPermission,
} from "../types";
import { normalizePermissions } from "./permissionNormalizer";

// ---------------------------------------------------------------------------
// App Metadata
// ---------------------------------------------------------------------------

export interface MetadataResult {
  app: AppMetadata | null;
  privacyPolicyUrl: string | null;
  error?: string;
}

/**
 * Retrieve full app metadata for a given appId.
 * Returns null for the app on confirmed missing (404-equivalent) or fatal error.
 * Never fabricates metadata or substitutes a different app.
 */
export async function retrieveAppMetadata(
  appId: string,
): Promise<MetadataResult> {
  try {
    const raw: IAppItemFullDetail = await gplay.app({
      appId,
      lang: "en",
      country: "us",
    });

    const app: AppMetadata = {
      appId: raw.appId,
      name: raw.title ?? appId,
      developer: raw.developer ?? null,
      icon: raw.icon ?? null,
      rating: typeof raw.score === "number" ? raw.score : null,
      category: raw.genre ?? null,
      storeUrl: raw.url ?? null,
    };

    // The runtime payload contains Play's policy URL, although the bundled
    // type omits it. A developer homepage is not a safe policy substitute.
    const rawAny = raw as unknown as Record<string, unknown>;
    const privacyPolicyUrl =
      typeof rawAny["privacyPolicy"] === "string"
        ? rawAny["privacyPolicy"]
        : null;

    return { app, privacyPolicyUrl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { app: null, privacyPolicyUrl: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export interface PermissionsResult {
  permissions: RetrievedPermission[];
  status: RetrievalSourceStatus["permissions"];
  error?: string;
}

/**
 * Retrieve and normalize the permissions requested by an app.
 * Returns an empty array with status 'unavailable' when no permissions are found.
 * A permission means the app requests a capability — it does not prove collection.
 */
export async function retrievePermissions(
  appId: string,
): Promise<PermissionsResult> {
  try {
    // google-play-scraper 10.1.x returns string[] at runtime even though its
    // bundled TypeScript declaration still describes permission objects.
    // Accept both shapes so a declaration/runtime mismatch does not erase data.
    const raw = (await gplay.permissions({
      appId,
      lang: "en",
      short: "false",
    })) as unknown;

    const rawStrings = Array.isArray(raw)
      ? raw.flatMap((entry) => {
          if (typeof entry === "string") return [entry];
          if (isRecord(entry) && typeof entry.permission === "string") {
            return [entry.permission];
          }
          return [];
        })
      : [];

    if (rawStrings.length === 0) {
      return { permissions: [], status: "unavailable" };
    }

    const permissions = normalizePermissions(rawStrings);
    return { permissions, status: "available" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { permissions: [], status: "failed", error: message };
  }
}

// ---------------------------------------------------------------------------
// Data Safety
// ---------------------------------------------------------------------------

export interface DataSafetyResult {
  dataSafety: DataSafety;
  status: RetrievalSourceStatus["dataSafety"];
  privacyPolicyUrl: string | null;
  error?: string;
}

interface RuntimeDataSafetyItem {
  data?: unknown;
  purpose?: unknown;
  type?: unknown;
}

interface RuntimeSecurityPractice {
  practice?: unknown;
  description?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePurposes(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((purpose) => purpose.trim())
    .filter(Boolean);
}

function parseDataSafetyItem(value: unknown): RuntimeDataSafetyItem | null {
  return isRecord(value) ? value : null;
}

/**
 * Retrieve Google Play Data Safety declarations for an app.
 * Data Safety is developer-provided disclosure — not independently verified runtime behavior.
 * Returns unavailable status when the section is absent, failed when retrieval errors.
 */
export async function retrieveDataSafety(
  appId: string,
): Promise<DataSafetyResult> {
  const empty: DataSafety = {
    collected: [],
    shared: [],
    securityPractices: [],
    deletionAvailable: null,
  };

  try {
    // google-play-scraper 10.1.x returns an object at runtime. Its declaration
    // still describes a flat array, so parse the observed payload defensively.
    const raw = (await gplay.datasafety({ appId, lang: "en" })) as unknown;
    if (!isRecord(raw)) {
      return {
        dataSafety: empty,
        status: "unavailable",
        privacyPolicyUrl: null,
      };
    }

    const collected: DataSafetyCollectedItem[] = (
      Array.isArray(raw.collectedData) ? raw.collectedData : []
    ).flatMap((value) => {
      const item = parseDataSafetyItem(value);
      if (!item || typeof item.type !== "string") return [];
      return [
        {
          type: item.type,
          label: typeof item.data === "string" ? item.data : item.type,
          purposes: parsePurposes(item.purpose),
        },
      ];
    });

    const shared: DataSafetySharedItem[] = (
      Array.isArray(raw.sharedData) ? raw.sharedData : []
    ).flatMap((value) => {
      const item = parseDataSafetyItem(value);
      if (!item || typeof item.type !== "string") return [];
      return [
        {
          type: item.type,
          label: typeof item.data === "string" ? item.data : item.type,
          purposes: parsePurposes(item.purpose),
          recipients: [],
        },
      ];
    });

    const securityPractices = (
      Array.isArray(raw.securityPractices) ? raw.securityPractices : []
    ).flatMap((value) => {
      if (typeof value === "string") return [value];
      const practice = isRecord(value)
        ? (value as RuntimeSecurityPractice)
        : null;
      return practice && typeof practice.practice === "string"
        ? [practice.practice]
        : [];
    });

    const hasDeletionRow = securityPractices.some((practice) =>
      practice.toLowerCase().includes("delet"),
    );
    const deletionAvailable: boolean | null = hasDeletionRow ? true : null;
    const privacyPolicyUrl =
      typeof raw.privacyPolicyUrl === "string" ? raw.privacyPolicyUrl : null;

    const dataSafety: DataSafety = {
      collected,
      shared,
      securityPractices,
      deletionAvailable,
    };

    // If all arrays are empty and deletion unknown, treat as unavailable
    const hasContent =
      collected.length > 0 ||
      shared.length > 0 ||
      securityPractices.length > 0 ||
      deletionAvailable !== null;

    return {
      dataSafety,
      status: hasContent ? "available" : "unavailable",
      privacyPolicyUrl,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      dataSafety: empty,
      status: "failed",
      privacyPolicyUrl: null,
      error: message,
    };
  }
}
