export interface SearchApp {
  appId: string;
  name: string;
  developer: string | null;
  icon: string | null;
  rating: number | null;
  category: string | null;
}

function nullableText(value: unknown): boolean {
  return value === null || typeof value === "string";
}

export function parseSearchResults(value: unknown): SearchApp[] {
  if (
    !value ||
    typeof value !== "object" ||
    !("results" in value) ||
    !Array.isArray(value.results)
  ) {
    throw new Error("Invalid search response");
  }
  const ids = new Set<string>();
  for (const app of value.results) {
    if (
      !app ||
      typeof app !== "object" ||
      typeof app.appId !== "string" ||
      !app.appId.trim() ||
      typeof app.name !== "string" ||
      !app.name.trim() ||
      !nullableText(app.developer) ||
      !nullableText(app.icon) ||
      !nullableText(app.category) ||
      !(
        app.rating === null ||
        (typeof app.rating === "number" &&
          Number.isFinite(app.rating) &&
          app.rating >= 0 &&
          app.rating <= 5)
      ) ||
      ids.has(app.appId)
    ) {
      throw new Error("Invalid search result");
    }
    ids.add(app.appId);
  }
  return value.results as SearchApp[];
}

export async function searchApps(query: string, signal: AbortSignal): Promise<SearchApp[]> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(
      response.status === 504
        ? "Search took too long. Please try again."
        : "Search is temporarily unavailable. Please try again.",
    );
  return parseSearchResults(await response.json());
}
