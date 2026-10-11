import { NextRequest, NextResponse } from "next/server";
import { reportSchema } from "@/lib/report";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  const { appId } = await params;
  if (!/^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+$/.test(appId) || appId.length > 255)
    return NextResponse.json(
      { error: { code: "INVALID_APP_ID", message: "Invalid Android app identifier." } },
      { status: 400 },
    );
  try {
    const url = new URL(
      `/api/analyze/${encodeURIComponent(appId)}`,
      process.env.BACKEND_API_URL || "http://127.0.0.1:4000",
    );
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(120000)]),
    });
    if (response.status === 404)
      return NextResponse.json(
        {
          error: { code: "APP_NOT_FOUND", message: "This app could not be found on Google Play." },
        },
        { status: 404 },
      );
    if (!response.ok) throw new Error("Analysis failed");
    const report = reportSchema.parse(await response.json());
    if (report.app.appId !== appId) throw new Error("Unexpected app");
    return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "ANALYSIS_FAILED",
          message: "Analysis could not be completed. Please retry.",
        },
      },
      { status: error instanceof Error && error.name === "TimeoutError" ? 504 : 502 },
    );
  }
}
