/**
 * App Data Retrieval — metadata, permissions, and Data Safety from Google Play.
 *
 * Owns: fetching and normalizing Play Store source data.
 * Does NOT own: AI analysis, privacy scoring, mismatch judgments.
 *
 * Partial source failure must not crash the entire retrieval flow.
 * Each source is retrieved independently; failures set sourceStatus accordingly.
 */

import type { IAppItemFullDetail, IPermissionItem } from 'google-play-scraper';
import {
  AppMetadata,
  DataSafety,
  DataSafetyCollectedItem,
  DataSafetySharedItem,
  RetrievalSourceStatus,
  RetrievedPermission,
} from '../types';
import { normalizePermissions } from './permissionNormalizer';
import { adaptDataSafety } from './dataSafetyAdapter';

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
export async function retrieveAppMetadata(appId: string): Promise<MetadataResult> {
  try {
    const { default: gplay } = await import('google-play-scraper');
    const raw: IAppItemFullDetail = await gplay.app({ appId, lang: 'en', country: 'us' });

    const app: AppMetadata = {
      appId: raw.appId,
      name: raw.title ?? appId,
      developer: raw.developer ?? null,
      icon: raw.icon ?? null,
      rating: typeof raw.score === 'number' ? raw.score : null,
      category: raw.genre ?? null,
      storeUrl: raw.url ?? null,
    };

    // IAppItemFullDetail does not expose privacyPolicy directly;
    // fall back to developerWebsite as a best-effort policy URL source.
    // The actual privacy policy URL is often embedded in the Play Store page
    // but not reliably typed — cast to any to access it if present.
    const rawAny = raw as unknown as Record<string, unknown>;
    const privacyPolicyUrl =
      (typeof rawAny['privacyPolicy'] === 'string' ? rawAny['privacyPolicy'] : null);

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
  status: RetrievalSourceStatus['permissions'];
  error?: string;
}

/**
 * Retrieve and normalize the permissions requested by an app.
 * Returns an empty array with status 'unavailable' when no permissions are found.
 * A permission means the app requests a capability — it does not prove collection.
 */
export async function retrievePermissions(appId: string): Promise<PermissionsResult> {
  try {
    // IFnPermissionsOptions.short expects string per type defs
    const { default: gplay } = await import('google-play-scraper');
    const raw: IPermissionItem[] = await gplay.permissions({ appId, lang: 'en' });

    // Each entry is { permission: string, type: string }
    const rawStrings: string[] = raw
      .filter((entry): entry is IPermissionItem => !!entry && typeof entry.permission === 'string')
      .map((entry) => entry.permission);

    if (rawStrings.length === 0) {
      return { permissions: [], status: 'unavailable' };
    }

    const permissions = normalizePermissions(rawStrings);
    return { permissions, status: 'available' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { permissions: [], status: 'failed', error: message };
  }
}

// ---------------------------------------------------------------------------
// Data Safety
// ---------------------------------------------------------------------------

export interface DataSafetyResult {
  dataSafety: DataSafety;
  privacyPolicyUrl?: string | null;
  status: RetrievalSourceStatus['dataSafety'];
  error?: string;
}

/**
 * Retrieve Google Play Data Safety declarations for an app.
 * Data Safety is developer-provided disclosure — not independently verified runtime behavior.
 * Returns unavailable status when the section is absent, failed when retrieval errors.
 */
export async function retrieveDataSafety(appId: string): Promise<DataSafetyResult> {
  const empty: DataSafety = {
    collected: [],
    shared: [],
    securityPractices: [],
    deletionAvailable: null,
  };

  try {
    const { default: gplay } = await import('google-play-scraper');
    const raw: unknown = await gplay.datasafety({ appId, lang: 'en' });
    return adaptDataSafety(raw);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { dataSafety: empty, status: 'failed', error: message };
  }
}

