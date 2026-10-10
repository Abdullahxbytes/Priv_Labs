/**
 * Retrieval orchestrator — coordinates all source retrievals for a given appId.
 *
 * Flow:
 *  1. Check cache first.
 *  2. Retrieve metadata (and policy URL) from Play.
 *  3. Retrieve permissions and Data Safety in parallel.
 *  4. Fetch and clean the privacy policy.
 *  5. Assemble structured output and cache it.
 *
 * Partial source failure does not crash the entire flow.
 * Each source has its own independent status in sourceStatus.
 */

import { retrieveAppMetadata, retrieveDataSafety, retrievePermissions } from './appDataRetrieval';
import { retrievePrivacyPolicy } from '../policy/policyRetrieval';
import { retrievalCache } from '../cache/retrievalCache';
import { RetrievalOutput, RetrievalSourceStatus } from '../types';

export interface OrchestratorResult {
  output: RetrievalOutput | null;
  /** Set when the app was confirmed missing on Google Play. */
  notFound?: boolean;
  /** Set when retrieval failed so completely no useful output was produced. */
  error?: string;
  /** True when output came from cache (not a fresh retrieval). */
  fromCache?: boolean;
}

/**
 * Retrieve all available source data for the given appId.
 * Returns a RetrievalOutput regardless of partial failures — sourceStatus reflects availability.
 */
export async function retrieveAppData(appId: string): Promise<OrchestratorResult> {
  // 1. Cache check — return previously retrieved real data if available
  const cached = retrievalCache.get(appId);
  if (cached) {
    // Mark all statuses that were 'available' as 'cached'
    const cachedOutput = markAsCached(cached.data);
    return { output: cachedOutput, fromCache: true };
  }

  // 2. Metadata retrieval (also yields the privacy policy URL)
  const metadataResult = await retrieveAppMetadata(appId);

  if (!metadataResult.app) {
    const isNotFound =
      metadataResult.error?.includes('404') ||
      metadataResult.error?.toLowerCase().includes('not found') ||
      metadataResult.error?.toLowerCase().includes('app not found');

    return {
      output: null,
      notFound: isNotFound,
      error: metadataResult.error ?? 'App metadata retrieval failed',
    };
  }

  // 3. Permissions + Data Safety in parallel (independent failures are acceptable)
  const [permissionsResult, dataSafetyResult] = await Promise.all([
    retrievePermissions(appId),
    retrieveDataSafety(appId),
  ]);

  // 4. Privacy policy
  const policyResult = await retrievePrivacyPolicy(metadataResult.privacyPolicyUrl);

  // 5. Assemble output
  const sourceStatus: RetrievalSourceStatus = {
    permissions: permissionsResult.status,
    dataSafety: dataSafetyResult.status,
    privacyPolicy: policyResult.status,
  };

  const output: RetrievalOutput = {
    app: metadataResult.app,
    permissions: permissionsResult.permissions,
    dataSafety: dataSafetyResult.dataSafety,
    privacyPolicy: policyResult.privacyPolicy,
    sourceStatus,
  };

  // 6. Cache the freshly retrieved output (real data only)
  retrievalCache.set(appId, output);

  return { output };
}

/**
 * Return a copy of the output with 'available' statuses marked as 'cached'
 * so consumers know this data comes from a previous retrieval.
 */
function markAsCached(output: RetrievalOutput): RetrievalOutput {
  const cachedStatus = { ...output.sourceStatus };

  if (cachedStatus.permissions === 'available') cachedStatus.permissions = 'cached';
  if (cachedStatus.dataSafety === 'available') cachedStatus.dataSafety = 'cached';
  if (cachedStatus.privacyPolicy === 'available') cachedStatus.privacyPolicy = 'cached';

  return { ...output, sourceStatus: cachedStatus };
}
