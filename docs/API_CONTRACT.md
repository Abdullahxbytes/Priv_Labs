# PrivacyLens — API Contract

> **Shared request/response fields must not be changed without team agreement.**

This document defines the interfaces between Member 1 (Frontend / UX), Member 2 (App Data / Retrieval), and Member 3 (Privacy Engine / Integration). [SOURCE_OF_TRUTH.md](SOURCE_OF_TRUTH.md) takes priority if documents conflict. This is a documentation contract, not an implemented API.

## General Rules

- Return JSON, with consistent camelCase property names. Enum values are case-sensitive and may use the explicitly documented formats below.
- Include declared fields; use `null` for nullable missing values and `[]` for arrays without returned items. Never use an empty array alone as proof that a practice is absent; consult source status.
- Do not silently rename fields or fabricate fallback findings, evidence, URLs, or scores.
- Errors use the structured error envelope in Section 17. Successful search uses a `results` envelope; successful analysis returns the report directly.
- JSON examples are illustrative fixtures, not claims about a real app or finalized scoring weights.

Shared terms: `FindingStatus` = `found`, `not_found`, or `unclear`; `Source` = `permissions`, `dataSafety`, or `privacyPolicy`; `Risk` = the values in Section 6. Array item IDs are unique within their report; every `evidenceIds` reference must resolve to an entry in that report's `evidence` array.

## 1. Search Endpoint

**GET `/api/search?q=<app-name>`** searches Google Play for multiple matching Android apps. Example: `/api/search?q=spotify`. A missing, empty, or whitespace-only query returns `400 INVALID_QUERY`.

HTTP 200:

```json
{
  "results": [
    {
      "appId": "com.example.app",
      "name": "Example App",
      "developer": "Example Developer",
      "icon": "https://example.com/icon.png",
      "rating": 4.3,
      "category": "Music"
    }
  ]
}
```

| Field | Type and rule |
| --- | --- |
| `appId` | Required nonempty string; unique Android package/app identifier within results. |
| `name` | Required nonempty string. |
| `developer` | String when available, otherwise `null`; key is always present. |
| `icon` | URL string or `null`. |
| `rating` | Number or `null`. |
| `category` | String or `null`. |

No matches returns HTTP 200 with `{"results": []}`. A failed search is an error, not an empty successful result. Never automatically select the first match.

## 2. Analysis Endpoint

**GET `/api/analyze/:appId`** runs retrieval and privacy analysis for the selected app. The path contains its app identifier, not a display name. Invalid input returns `400 INVALID_APP_ID`; a confirmed missing app returns `404 APP_NOT_FOUND`.

HTTP 200 returns the final report directly. Member 3 coordinates the Express route; Member 2 supplies retrieval data. This contract defines a final response, not streaming progress. Progress transport remains **TO BE FINALIZED**; the frontend must not invent completed backend steps.

## 3. Final Report Contract

All eleven top-level fields are required and frozen:

| Field | Type |
| --- | --- |
| `app` | App object (Section 4). |
| `score` | Number, subject to Section 5. |
| `riskLevel` | Risk enum (Section 6). |
| `sourceStatus` | Final source-status object (Section 7). |
| `permissions` | Permission object array. |
| `dataCollected` | Collection finding array. |
| `dataShared` | Sharing finding array. |
| `mismatches` | Comparison finding array. |
| `positiveFindings` | Positive finding array. |
| `summary` | String array. |
| `evidence` | Evidence object array. |

Do not add a new top-level wrapper or rename these fields. Unknown nested data follows the nullable rules below. The insufficient-evidence scoring case remains explicitly unresolved, not an invitation to fill in `0` or an empty risk string.

## 4. `app`

```json
{
  "appId": "com.example.app",
  "name": "Example App",
  "developer": "Example Developer",
  "icon": "https://example.com/icon.png",
  "rating": 4.3,
  "category": "Social",
  "storeUrl": "https://play.google.com/store/apps/details?id=com.example.app"
}
```

Uses the search-result field rules, plus required key `storeUrl` (URL string or `null`). `appId` and `name` are non-null strings; `developer`, `icon`, `rating`, `category`, and `storeUrl` are nullable. A policy URL belongs in internal `privacyPolicy.url` and relevant evidence, not a new top-level report field.

## 5. `score`

Type: **number**, finite and within **0–100**, calculated by deterministic backend rules. **100 = better privacy / lower privacy risk; 0 = worse privacy / higher privacy risk.** AI and frontend must not calculate it.

Weights, thresholds, rounding, duplicate handling, and incomplete-input behavior are defined in `docs/SCORING.md`. Missing or failed sources do not create score penalties; available evidence is scored deterministically. Partial source loss alone must not trigger a full-flow error, and the frontend must present incomplete coverage from `sourceStatus` alongside the numeric result.

## 6. `riskLevel`

Allowed values: **`LOW`, `MODERATE`, `HIGH`, `VERY HIGH`**. Member 3 assigns them using agreed deterministic rules; frontend displays them.

**Conflict resolved by document priority:** the requested draft proposed `VERY_HIGH`, while SOURCE_OF_TRUTH.md and the existing role docs require `VERY HIGH`. This contract preserves `VERY HIGH` for both wire value and display until the team explicitly agrees to change it. Do not silently accept alternate spellings.

## 7. `sourceStatus`

The final report requires all four keys:

```json
{
  "permissions": "available",
  "dataSafety": "available",
  "privacyPolicy": "available",
  "aiAnalysis": "available"
}
```

| Status | Meaning |
| --- | --- |
| `available` | Usable source data was retrieved, or AI analysis completed and passed validation. |
| `unavailable` | The source is absent/not obtainable, or AI cannot run because usable policy text is absent. |
| `failed` | Attempted retrieval or AI processing failed, including invalid AI output after allowed retries. |
| `cached` | Usable results originate from previously retrieved real data or previously validated analysis; never fabricated. |

Member 2 produces the first three statuses; Member 3 adds `aiAnalysis`. A policy URL alone is not successful text retrieval. Policy retrieval can be `available` while `aiAnalysis` is `failed`. Fresh AI analysis of cached policy text is `available`; the policy status remains `cached`.

`not_required` is **not included** without team agreement. Status indicates coverage, not privacy risk. Detailed timestamps/freshness metadata remain **TO BE FINALIZED** without changing the frozen top-level fields; meanwhile cached status must remain visible. This enum does not introduce a new AI caching component.

## 8. `permissions`

```json
{
  "raw": "android.permission.ACCESS_FINE_LOCATION",
  "name": "Precise Location",
  "category": "location",
  "risk": "HIGH",
  "expected": true,
  "explanation": "This permission allows access to precise location."
}
```

All keys are present: `raw` is string or `null`; `name` is a readable string; `category` is normalized category string or `null` if unmapped; `risk` is Risk or `null` if unassessed; `expected` is boolean or `null`; `explanation` is a neutral string. Member 3 supplies risk/expected interpretation under agreed rules, not Member 2 or the frontend. The example's classification is illustrative, not a permission-risk rule.

A permission proves neither collection nor upload. Candidate category tokens include `location`, `contacts`, `camera`, `microphone`, `photos`, `files`, `messages`, `phone`, `calendar`, `nearby_devices`, `personal_information`, `financial_information`, `health_information`, `device_identifiers`, and `app_activity`. The complete category vocabulary and mappings, including SMS to `messages`, require team agreement before implementation; they are **TO BE FINALIZED**, not independently extensible enums.

## 9. `dataCollected`

```json
{
  "type": "location",
  "label": "Location",
  "purposes": ["personalization", "analytics"],
  "source": ["dataSafety", "privacyPolicy"],
  "status": "found"
}
```

Required keys: `type` (category string), `label` (string), `purposes` (string array), `source` (nonempty array containing `dataSafety` and/or `privacyPolicy`), and `status` (FindingStatus). Permissions cannot be evidence of collection. Use `[]` for unknown purposes, not guessed purposes.

`not_found` means no relevant statement was found in inspected content, not proof that collection never occurs. Keep source-specific entries separate when statuses or meaning differ; do not merge conflicting declarations into a misleading combined claim.

## 10. `dataShared`

```json
{
  "type": "device_identifiers",
  "label": "Device Identifiers",
  "recipients": ["advertising partners"],
  "purposes": ["advertising"],
  "source": ["privacyPolicy"],
  "status": "found"
}
```

Uses collection-item rules with the additional required `recipients` string array. Unknown recipients use `[]`; do not invent them. Retain source attribution and uncertainty.

## 11. `mismatches`

```json
{
  "id": "mismatch-1",
  "type": "UNCLEAR_DISCLOSURE",
  "severity": null,
  "title": "Contacts not clearly disclosed",
  "explanation": "Contacts access is requested, but contact-data handling was not clearly identified in the inspected disclosures.",
  "sources": ["permissions", "dataSafety", "privacyPolicy"],
  "evidenceIds": ["evidence-1"]
}
```

Required keys: `id`, `title`, `explanation` (strings), `type` (enum below), `severity` (Risk or `null`), `sources` (Source array), and `evidenceIds` (string array referencing actual report evidence).

Types: `PERMISSION_DISCLOSURE_MISMATCH`, `DATA_SAFETY_POLICY_MISMATCH`, `UNCLEAR_DISCLOSURE`, `INSUFFICIENT_INFORMATION`. The draft's generic `DISCLOSURE_MISMATCH` example is replaced by these specific types; do not invent aliases.

The array can include uncertainty notices. `INSUFFICIENT_INFORMATION` is not an actual mismatch and has `severity: null`; the frontend must not count it as a detected inconsistency. Missing sources alone cannot justify other mismatch types or risk penalties. `sources` identifies sources involved, including missing ones for an insufficiency notice; `evidenceIds` references only real inspected evidence. Never accuse developers of misconduct.

## 12. `positiveFindings`

```json
{
  "id": "positive-1",
  "title": "Data deletion available",
  "explanation": "The available disclosures indicate that users can request data deletion.",
  "evidenceIds": ["evidence-2"]
}
```

All keys required: three strings and a string array of valid evidence references. Positive claims require support, not absent sources. Do not turn an incomplete comparison into “no major inconsistencies found.”

## 13. `summary`

An array of short consumer-friendly strings, normally 3–5 when supported:

```json
[
  "The app requests location access.",
  "Location collection is disclosed.",
  "One possible disclosure mismatch was found."
]
```

Use neutral wording consistent with actual findings and coverage. Do not invent statements to meet a target length; include relevant partial-analysis limitations.

## 14. `evidence`

```json
{
  "id": "evidence-2",
  "source": "privacyPolicy",
  "category": "deletion",
  "status": "found",
  "excerpt": "You may request deletion of your account data.",
  "sourceUrl": "https://example.com/privacy"
}
```

Required keys: `id` (string), `source` (Source), `category` (string), `status` (FindingStatus), `excerpt` (short source text or `null`), and `sourceUrl` (URL string or `null`). Evidence categories may describe policy topics such as deletion, retention, or security as well as data categories; their vocabulary must be coordinated with Member 3.

Never fabricate a quote to prove absence: `not_found` can have `excerpt: null`. Excerpts must faithfully reflect inspected content. An AI provider is not an evidence source; model findings refer back to the privacy policy. Separate snippets above illustrate individual objects; their IDs are not a complete report fixture.

## 15. Retrieval-Layer Contract

Member 2 passes this internal structure to Member 3, not directly to the frontend:

```json
{
  "app": {
    "appId": "com.example.app",
    "name": "Example App",
    "developer": null,
    "icon": null,
    "rating": null,
    "category": null,
    "storeUrl": null
  },
  "permissions": [],
  "dataSafety": {
    "collected": [],
    "shared": [],
    "securityPractices": [],
    "deletionAvailable": null
  },
  "privacyPolicy": {"url": null, "text": null},
  "sourceStatus": {
    "permissions": "unavailable",
    "dataSafety": "unavailable",
    "privacyPolicy": "unavailable"
  }
}
```

- `app`: Section 4 shape.
- `permissions`: objects containing `raw` (string/null), `name` (string), and `category` (string/null). Preserve identifiers and source labels; no risk, expected-use assessment, or privacy judgment is required from retrieval.
- `dataSafety.collected`: objects with `type` and `label` (source-provided strings) and `purposes` (string array).
- `dataSafety.shared`: the same shape plus `recipients` (string array).
- `dataSafety.securityPractices`: strings preserving developer declarations, including encryption wording where present.
- `dataSafety.deletionAvailable`: boolean/null; `false` requires an explicit source statement, not missing content.
- `privacyPolicy.url` and `.text`: URL string/null and cleaned text string/null. Do not summarize or interpret the policy in retrieval.
- `sourceStatus`: the three retrieval keys, using Section 7 statuses; Member 2 does not set `aiAnalysis`.

Member 3 normalizes source terminology and produces final findings. Empty arrays with unavailable status mean unknown coverage, not no collection/sharing. Preserve real source provenance and cache freshness through integration; exact additional internal provenance metadata is **TO BE FINALIZED** together before implementation, not a new public report field. Do not expose raw HTML or unnecessary retrieval internals to the frontend.

## 16. AI Output Contract

Groq receives cleaned policy text and returns conceptual structured JSON:

```json
{
  "dataCollected": [],
  "dataShared": [],
  "thirdParties": [],
  "retention": {"status": "unclear", "details": null},
  "deletion": {"status": "unclear", "details": null},
  "security": [],
  "evidence": []
}
```

- `dataCollected` and `dataShared`: Section 9/10 item shapes restricted to `source: ["privacyPolicy"]`.
- `thirdParties`: strings naming disclosed recipients; do not guess unnamed parties.
- `retention` and `deletion`: objects with `status` (FindingStatus) and `details` (string/null).
- `security`: objects with `status` (FindingStatus) and `details` (string/null), describing disclosed security practices.
- `evidence`: Section 14 shape with source `privacyPolicy`; Member 3 assigns/remaps unique final IDs and source URL from retrieval context.

**Validate AI output with Zod before use.** Exact Zod code belongs in implementation; this document defines shared meaning. Malformed output permits controlled parsing/retry, followed by validation, or partial continuation with `aiAnalysis: failed`. Syntactic validation does not prove claims are true; retain source-backed evidence. AI output contains no final score, risk assignment, or cross-source mismatch verdict.

Provider: **Groq API**. Model: **OpenAI GPT-OSS 120B** with model ID **`openai/gpt-oss-120b`**. It is an open-weight mixture-of-experts model with 117B total parameters and 5.1B active parameters per token. The former 8B restriction no longer applies.

## 17. Error Contract

```json
{
  "error": {
    "code": "APP_NOT_FOUND",
    "message": "The requested application could not be found."
  }
}
```

`error.code` and `error.message` are required strings. Codes: `INVALID_QUERY`, `APP_NOT_FOUND`, `SEARCH_FAILED`, `RETRIEVAL_FAILED`, `ANALYSIS_FAILED`, `INVALID_APP_ID`, `INTERNAL_ERROR`. Messages must be understandable and contain no stack traces, credentials, or sensitive environment values. Use full-request errors only when the request cannot return a useful result under the agreed rules.

## 18. HTTP Status Guidance

| HTTP status | Use |
| --- | --- |
| 200 | Successful search, including no matches; full or supported partial report. |
| 400 | `INVALID_QUERY` or `INVALID_APP_ID`. |
| 404 | Confirmed `APP_NOT_FOUND`. |
| 500 | Unexpected server error, normally `INTERNAL_ERROR`. |
| 502 | Dependency failure preventing a useful response; use the relevant search/retrieval/analysis error code. |
| 503 | Temporary dependency unavailability preventing a useful response. |

Do not return 404 merely because an upstream request failed. Keep status handling simple and consistent.

## 19. Partial Success

If one source fails but a useful report can be produced under the agreed scoring rules, return **HTTP 200** with all frozen fields and accurate statuses. For example, this is a fragment of a report, not its complete response:

```json
{
  "sourceStatus": {
    "permissions": "available",
    "dataSafety": "failed",
    "privacyPolicy": "available",
    "aiAnalysis": "available"
  }
}
```

Retain available findings and evidence. Do not fail the report simply because one source is missing, fabricate replacement findings, or convert missing data into safety claims. The no-meaningful-score case in Section 5 must be settled before this flow is implemented; do not silently improvise its response.

## 20. Field Change Rule

Discuss changes to endpoint names, top-level report fields, status enums, risk enums, normalized privacy categories, or major nested schemas with the team first. Record important changes in `docs/DECISIONS.md` once created.

Open decisions: insufficient-evidence score/risk representation, scoring thresholds and weights, complete category mappings, permission risk/expected rules, detailed freshness/provenance metadata, and progress transport. None are silently finalized by the example values in this document.

## 21. Ownership

| Member | Contract responsibility |
| --- | --- |
| Member 1 — Frontend / UX | Consumes frontend-facing search and final report responses. |
| Member 2 — App Data / Retrieval | Produces search results, retrieval-layer data, and retrieval source statuses. |
| Member 3 — Privacy Engine / Integration | Coordinates shared Express integration, validates AI output, and produces the final report. |

Member 3 coordinates contract changes but cannot independently change frozen fields or rewrite other teammates' modules. The agreed Next.js frontend, Node.js/Express backend, TypeScript, Tailwind, `google-play-scraper`, Cheerio, Groq, Zod, and in-memory `Map` remain unchanged.
