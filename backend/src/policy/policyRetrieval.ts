/**
 * Privacy policy retrieval and HTML cleaning.
 *
 * Owns: fetching policy HTML (with timeout + redirect handling)
 *       and using Cheerio to extract readable text.
 *
 * Does NOT summarize, interpret, or score the policy.
 * Returns cleaned text and source reference to Member 3.
 *
 * Treats retrieved HTML as untrusted input — never executes scripts.
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { PrivacyPolicy, SourceStatusValue } from "../types";

// ---------------------------------------------------------------------------
// Config (TO BE FINALIZED with team if needed)
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
const MAX_RETRIES = 1; // One simple retry for transient failures
const MAX_DOCUMENT_REDIRECTS = 2;

/** Elements to remove before extracting text — boilerplate, navigation, scripts. */
const REMOVE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "nav",
  "header",
  "footer",
  "iframe",
  ".cookie-banner",
  ".cookie-notice",
  '[role="navigation"]',
  '[aria-label="navigation"]',
  ".nav",
  ".navbar",
  ".menu",
  ".sidebar",
  ".advertisement",
  ".ad",
  ".social-links",
  "#cookie-notice",
  "#cookieBanner",
];

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export interface PolicyFetchResult {
  html: string | null;
  status: SourceStatusValue;
  error?: string;
}

async function fetchPolicyHtml(
  url: string,
  attempt: number = 1,
): Promise<PolicyFetchResult> {
  try {
    const response = await axios.get<string>(url, {
      timeout: FETCH_TIMEOUT_MS,
      maxRedirects: MAX_REDIRECTS,
      responseType: "text",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PrivacyLens/1.0; +https://github.com/Abdullahxbytes/PrivacyLens)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      validateStatus: (status) => status < 500,
    });

    if (response.status === 404 || response.status === 410) {
      return {
        html: null,
        status: "unavailable",
        error: `HTTP ${response.status}`,
      };
    }

    if (response.status >= 400) {
      return { html: null, status: "failed", error: `HTTP ${response.status}` };
    }

    const contentType = String(response.headers["content-type"] ?? "");
    if (!contentType.includes("html") && !contentType.includes("text")) {
      return {
        html: null,
        status: "failed",
        error: `Unexpected content-type: ${contentType}`,
      };
    }

    const html = typeof response.data === "string" ? response.data : null;
    if (!html || html.trim().length === 0) {
      return {
        html: null,
        status: "unavailable",
        error: "Empty response body",
      };
    }

    return { html, status: "available" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // One simple retry for transient errors (timeouts, network blips)
    if (attempt < MAX_RETRIES + 1 && isTransientError(err)) {
      return fetchPolicyHtml(url, attempt + 1);
    }

    return { html: null, status: "failed", error: message };
  }
}

function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as NodeJS.ErrnoException).code;
  return (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ECONNABORTED" ||
    err.message.includes("timeout")
  );
}

// ---------------------------------------------------------------------------
// Clean
// ---------------------------------------------------------------------------

/**
 * Use Cheerio to strip noise and extract readable text from policy HTML.
 * Does not summarize or interpret content.
 */
function cleanPolicyHtml(html: string): string | null {
  const $ = cheerio.load(html);

  // Remove noise elements
  for (const selector of REMOVE_SELECTORS) {
    $(selector).remove();
  }

  // Prefer main content areas first
  const contentSelectors = [
    "main",
    "article",
    '[role="main"]',
    ".content",
    "#content",
    "body",
  ];
  let text = "";

  for (const sel of contentSelectors) {
    const el = $(sel);
    if (el.length > 0) {
      text = el.text();
      break;
    }
  }

  if (!text) {
    text = $("body").text();
  }

  // Normalize whitespace
  text = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return text.length > 50 ? text : null;
}

function findDocumentRedirect(html: string, sourceUrl: string): string | null {
  const $ = cheerio.load(html);
  const candidates = [
    $('meta[http-equiv="refresh" i]')
      .attr("content")
      ?.match(/url\s*=\s*([^;]+)/i)?.[1],
    $("noscript a[href]").first().attr("href"),
    $("a#link[href]").attr("href"),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const redirect = new URL(
        candidate.trim().replace(/^['"]|['"]$/g, ""),
        sourceUrl,
      );
      if (redirect.protocol === "http:" || redirect.protocol === "https:") {
        return redirect.toString();
      }
    } catch {
      // Ignore malformed redirect hints from the source page.
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PolicyRetrievalResult {
  privacyPolicy: PrivacyPolicy;
  status: SourceStatusValue;
  error?: string;
}

/**
 * Fetch and clean the privacy policy at the given URL.
 * Returns a failure state cleanly without crashing the retrieval pipeline.
 */
export async function retrievePrivacyPolicy(
  url: string | null,
): Promise<PolicyRetrievalResult> {
  if (!url) {
    return {
      privacyPolicy: { url: null, text: null },
      status: "unavailable",
    };
  }

  let currentUrl = url;
  const visited = new Set<string>();

  for (
    let redirectCount = 0;
    redirectCount <= MAX_DOCUMENT_REDIRECTS;
    redirectCount += 1
  ) {
    if (visited.has(currentUrl)) break;
    visited.add(currentUrl);

    const fetchResult = await fetchPolicyHtml(currentUrl);
    if (!fetchResult.html) {
      return {
        privacyPolicy: { url: currentUrl, text: null },
        status: fetchResult.status,
        error: fetchResult.error,
      };
    }

    const cleanedText = cleanPolicyHtml(fetchResult.html);
    if (cleanedText) {
      return {
        privacyPolicy: { url: currentUrl, text: cleanedText },
        status: "available",
      };
    }

    const documentRedirect = findDocumentRedirect(fetchResult.html, currentUrl);
    if (!documentRedirect || visited.has(documentRedirect)) {
      return {
        privacyPolicy: { url: currentUrl, text: null },
        status: "unavailable",
        error: "The policy page requires a browser to display its text",
      };
    }
    currentUrl = documentRedirect;
  }

  return {
    privacyPolicy: { url: currentUrl, text: null },
    status: "unavailable",
    error: "The policy page redirected too many times",
  };
}
