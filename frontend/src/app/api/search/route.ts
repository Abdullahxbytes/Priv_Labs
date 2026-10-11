import { NextRequest, NextResponse } from "next/server";
import { parseSearchResults } from "@/lib/search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length > 200) {
    return NextResponse.json(
      { error: { code: "INVALID_QUERY", message: "Enter an app name of at most 200 characters." } },
      { status: 400 },
    );
  }
  try {
    const url = new URL("/api/search", process.env.BACKEND_API_URL || "http://127.0.0.1:4000");
    url.searchParams.set("q", query);
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(20000)]),
    });
    if (!response.ok) throw new Error("Backend search failed");
    const results = parseSearchResults(await response.json());
    return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      {
        error: {
          code: "SEARCH_FAILED",
          message: "App search could not be completed. Please try again.",
        },
      },
      { status: timedOut ? 504 : 502 },
    );
  }
}
