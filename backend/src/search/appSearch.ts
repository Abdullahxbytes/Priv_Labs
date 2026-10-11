/**
 * Google Play app search using google-play-scraper.
 * Returns multiple matching results so the user can identify the correct app.
 * Never auto-selects the first result.
 */

import { AppSearchResult } from '../types';

const MAX_RESULTS = 10;

export interface SearchResult {
  results: AppSearchResult[];
  error?: string;
}

/**
 * Search Google Play for apps matching the query.
 * Returns up to MAX_RESULTS matching apps.
 * Distinguishes no-results (empty array, no error) from a failed search (error set).
 */
export async function searchApps(query: string): Promise<SearchResult> {
  try {
    const { default: gplay } = await import('google-play-scraper');
    const raw = await gplay.search({
      term: query,
      num: MAX_RESULTS,
      lang: 'en',
      country: 'us',
      throttle: 10,
    });

    const results: AppSearchResult[] = raw.map((app: any) => ({
      appId: app.appId as string,
      name: (app.title as string) ?? app.appId,
      developer: (app.developer as string) ?? null,
      icon: (app.icon as string) ?? null,
      rating: typeof app.score === 'number' ? app.score : null,
      category: (app.genre as string) ?? null,
    }));

    return { results };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { results: [], error: message };
  }
}
