/**
 * Shared TypeScript types for PrivacyLens — App Data / Retrieval layer.
 * Aligned with docs/API_CONTRACT.md.
 * DO NOT change frozen field names without team agreement.
 */

// ---------------------------------------------------------------------------
// Source Status
// ---------------------------------------------------------------------------

export type SourceStatusValue = 'available' | 'unavailable' | 'failed' | 'cached';

/** Retrieval-layer source statuses produced by Member 2. */
export interface RetrievalSourceStatus {
  permissions: SourceStatusValue;
  dataSafety: SourceStatusValue;
  privacyPolicy: SourceStatusValue;
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

/** Shape used in search results and the retrieval layer. */
export interface AppSearchResult {
  appId: string;
  name: string;
  developer: string | null;
  icon: string | null;
  rating: number | null;
  category: string | null;
}

/** Full app metadata returned in the retrieval layer. */
export interface AppMetadata extends AppSearchResult {
  storeUrl: string | null;
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

/** Raw permission as returned by the retrieval layer.
 *  Risk assessment and expected/unusual judgment belong to Member 3. */
export interface RetrievedPermission {
  /** Original Android permission identifier, e.g. "android.permission.ACCESS_FINE_LOCATION" */
  raw: string | null;
  /** Human-readable label, e.g. "Precise Location" */
  name: string;
  /** Normalized category token, e.g. "location". null when unmapped. Finalized with Member 3. */
  category: string | null;
}

// ---------------------------------------------------------------------------
// Data Safety
// ---------------------------------------------------------------------------

export interface DataSafetyCollectedItem {
  type: string;
  label: string;
  purposes: string[];
}

export interface DataSafetySharedItem extends DataSafetyCollectedItem {
  recipients: string[];
}

export interface DataSafety {
  collected: DataSafetyCollectedItem[];
  shared: DataSafetySharedItem[];
  /** Raw developer-provided security practice strings (e.g. "Data is encrypted in transit"). */
  securityPractices: string[];
  /** false only when an explicit source statement says deletion is NOT available. null when unknown. */
  deletionAvailable: boolean | null;
}

// ---------------------------------------------------------------------------
// Privacy Policy
// ---------------------------------------------------------------------------

export interface PrivacyPolicy {
  url: string | null;
  /** Cheerio-cleaned readable text. null when unavailable or fetch failed. */
  text: string | null;
}

// ---------------------------------------------------------------------------
// Retrieval Output (Member 2 → Member 3)
// ---------------------------------------------------------------------------

/** Complete structured retrieval output passed to Member 3 (Privacy Engine).
 *  NOT the final report — final report is produced by Member 3. */
export interface RetrievalOutput {
  app: AppMetadata;
  permissions: RetrievedPermission[];
  dataSafety: DataSafety;
  privacyPolicy: PrivacyPolicy;
  sourceStatus: RetrievalSourceStatus;
}

// ---------------------------------------------------------------------------
// Search Response (API surface)
// ---------------------------------------------------------------------------

export interface SearchResponse {
  results: AppSearchResult[];
}

// ---------------------------------------------------------------------------
// Error Response
// ---------------------------------------------------------------------------

export type ErrorCode =
  | 'INVALID_QUERY'
  | 'APP_NOT_FOUND'
  | 'SEARCH_FAILED'
  | 'RETRIEVAL_FAILED'
  | 'ANALYSIS_FAILED'
  | 'INVALID_APP_ID'
  | 'INTERNAL_ERROR';

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
  };
}
