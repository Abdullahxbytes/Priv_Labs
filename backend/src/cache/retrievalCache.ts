/**
 * In-memory retrieval cache keyed by appId.
 * Uses a plain Map — no database for the MVP.
 * Cache is lost on process restart; expiration policy is TO BE FINALIZED with the team.
 *
 * IMPORTANT: Only real previously-retrieved data is stored here.
 * Never fabricate cache entries.
 */

import { RetrievalOutput } from "../types";

interface CacheEntry {
  data: RetrievalOutput;
  /** Unix timestamp (ms) when this entry was stored. */
  storedAt: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000;

class RetrievalCache {
  private readonly store = new Map<string, CacheEntry>();

  /** Store a retrieval result for an appId. */
  set(appId: string, data: RetrievalOutput): void {
    this.store.set(appId, { data, storedAt: Date.now() });
  }

  /** Retrieve a cached result. Returns undefined on cache miss. */
  get(appId: string): CacheEntry | undefined {
    const entry = this.store.get(appId);
    if (!entry) return undefined;
    if (Date.now() - entry.storedAt >= CACHE_TTL_MS) {
      this.store.delete(appId);
      return undefined;
    }
    return entry;
  }

  /** Check whether a fresh-enough cached entry exists. */
  has(appId: string): boolean {
    return this.store.has(appId);
  }

  /** Remove a specific entry (e.g. after a known retrieval failure). */
  delete(appId: string): void {
    this.store.delete(appId);
  }

  /** Return the number of cached entries (useful for health/debug endpoints). */
  size(): number {
    return this.store.size;
  }
}

/** Singleton cache instance shared across the process. */
export const retrievalCache = new RetrievalCache();
