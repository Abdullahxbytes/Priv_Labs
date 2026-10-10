# Member 2 — App Data / Retrieval

> **This file defines the ownership boundary for the App Data / Retrieval teammate and their coding agent.**

## Mission

Provide reliable structured app and privacy-source data to the Privacy Engine:

**App search → multiple results → selected app → metadata → permissions → Data Safety → privacy-policy URL → policy HTML → cleaned policy text → structured retrieval output.**

This role provides factual source data. It does not interpret privacy risk, generate mismatch conclusions, calculate privacy scores, or produce final consumer-facing privacy judgments.

## Technology

Use **Node.js, Express, TypeScript, `google-play-scraper`, Cheerio, in-memory `Map` caching, and npm**. Do not introduce a database for the MVP or another scraping framework without team agreement.

## Read First

Before implementation, read:

- [SOURCE_OF_TRUTH.md](../SOURCE_OF_TRUTH.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md)
- [TEAM_TASKS.md](../TEAM_TASKS.md)
- `docs/API_CONTRACT.md` once available
- This file, `docs/team/APP_DATA.md`
- [PRIVACY_ENGINE.md](PRIVACY_ENGINE.md) for the receiving module's boundary

The API contract does not yet exist; exact schemas and status semantics are **TO BE FINALIZED** together. If documents conflict, **SOURCE_OF_TRUTH.md has priority**.

## Owns

- Google Play app search and search-result normalization.
- App metadata retrieval and app/package ID handling.
- Permissions retrieval and permission-name normalization where practical.
- Data Safety retrieval and privacy-policy URL discovery.
- Privacy-policy HTML fetching, Cheerio parsing, and policy text cleaning.
- Source-status generation for retrieval sources.
- Retrieval caching, timeouts, practical retries, and retrieval-specific error handling.

## Does Not Own

Frontend UI and styling belong to Member 1. Groq integration, AI prompts, structured AI extraction, Zod validation for AI output, normalization of AI findings, comparison logic, mismatch judgments/scoring, privacy scoring, risk-level assignment, final report generation, and final consumer-facing wording belong to Member 3.

## 1. App Search

Given a query such as `spotify`, return multiple matching Android apps using `google-play-scraper`. Expected fields include `appId`, `name`, `developer`, `icon`, `rating`, and `category`, following `docs/API_CONTRACT.md` once finalized. Do not automatically choose the first result; the user selects the app.

## 2. App Metadata

Given an `appId`, retrieve available app ID, name, developer, icon, rating, category, store URL, and privacy-policy URL. Return `null` for unavailable optional fields where the agreed contract permits it. Never fabricate missing metadata or substitute a different app.

## 3. Permissions

Retrieve requested permissions where available and preserve useful raw identifiers. Normalize names into readable labels where practical: `android.permission.ACCESS_FINE_LOCATION` → **Precise Location**.

Potential permission groupings include location, contacts, camera, microphone, photos, files, SMS, phone, calendar, and nearby devices. Exact shared mappings are **TO BE FINALIZED** with Member 3. Retrieval owns source formatting and readable permission labels; Member 3 owns semantic normalization across permissions, Data Safety, and AI findings.

**A permission means the app requests or may request a capability. It does not prove collection or upload.** Do not infer behavior or privacy risk.

## 4. Data Safety

Retrieve available Google Play declarations for data collected, data shared, purposes, security practices, deletion availability, and encryption information. Preserve source meaning and distinguish unknown values from explicit negative declarations.

Data Safety is developer-provided disclosure data, not independently verified runtime behavior.

## 5. Privacy Policy URL

Discover the policy URL from the app listing where available. If missing, do not fabricate a URL; mark the source appropriately and allow the pipeline to continue.

## 6. Privacy Policy Fetching

Download policy HTML with sensible timeout handling, redirect handling, and response validation. Return a clear failure state when retrieval fails without crashing the entire retrieval process. The HTTP download mechanism and exact limits are **TO BE FINALIZED**; Cheerio handles parsing and cleaning.

## 7. Privacy Policy Cleaning

Use Cheerio to extract meaningful readable text. Remove scripts, styles, navigation, cookie banners, menus, repeated footers, and obvious boilerplate where practical, while preserving relevant policy content.

Do not summarize or interpret the policy. Return cleaned text and its source reference to Member 3.

## 8. Source Status

Return status for at least `permissions`, `dataSafety`, and `privacyPolicy`, using the exact enum in `docs/API_CONTRACT.md` once agreed. Expected statuses may include `available`, `unavailable`, `failed`, and `cached`; do not independently invent additional statuses.

Missing information is not evidence of safety. A retrieved policy URL alone does not establish that usable policy text was retrieved. Retrieval status does not represent AI-analysis success; Member 3 handles analysis outcomes.

## 9. Retrieval Cache

Use an in-memory `Map`, keyed by `appId` for useful app retrieval data such as metadata, permissions, Data Safety, policy URL, and cleaned policy text. Avoid repeated external requests, reduce scraping load, and improve demo reliability.

Cache entries must come from previously retrieved real data. **Never fabricate cached fallback results.** Preserve source status and relevant freshness information so consumers can distinguish cached from fresh retrieval. The cache is lost on restart; expiration and fallback policy are **TO BE FINALIZED**.

## 10. Expected Output to Privacy Engine

Return structured retrieval data compatible with `docs/API_CONTRACT.md`. The following is a **conceptual shape, not a finalized schema or real result**:

```json
{
  "app": {
    "appId": "",
    "name": "",
    "developer": "",
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
  "privacyPolicy": {
    "url": null,
    "text": null
  },
  "sourceStatus": {
    "permissions": "unavailable",
    "dataSafety": "unavailable",
    "privacyPolicy": "unavailable"
  }
}
```

Statuses here reflect missing placeholder data; set actual statuses from retrieval outcomes. Empty arrays must not imply verified absence when the source is unavailable. Exact nested schemas, provenance/freshness representation, and missing-value semantics remain **TO BE FINALIZED** in the API contract. Do not independently change shared fields.

This intermediate retrieval structure is distinct from the frozen final report produced by Member 3. It does not rename or replace final report fields.

## 11. Search Endpoint Responsibility

Own the data/retrieval logic behind `GET /api/search?q=<app-name>`. The endpoint contract belongs in `docs/API_CONTRACT.md`; do not independently rename endpoints. Coordinate shared Express wiring with Member 3, the integration owner.

## 12. Analysis Support Responsibility

Provide retrieval data for `GET /api/analyze/:appId`. Member 3 owns privacy analysis and final report generation. Do not duplicate that logic or modify another module to force integration; agree on compatible output or adapters.

## 13. Error Handling

Handle empty search queries, no search results, Google Play failures, invalid app IDs, unavailable permissions, unavailable Data Safety, missing policy URLs, policy timeouts, sites blocking requests, malformed external responses, and temporary scraping failures.

Distinguish no results from a failed search. Partial source failure must not crash the entire retrieval flow: return available data and accurate source statuses. Exact error responses belong in the API contract.

## 14. Retries

Keep retries simple. Where appropriate, use one controlled retry for transient external failures; otherwise return failure cleanly. Do not build complex retry infrastructure or repeatedly retry permanent failures. Exact timeout/retry settings are **TO BE FINALIZED**.

## 15. Rate Limit / External Request Rules

Be conservative with requests. Check eligible cache entries before repeated requests for the same app. Do not hammer Google Play or policy sites, and do not build unnecessary concurrent scraping. Avoid retry loops that may trigger rate limits.

## 16. Security

- Never commit secrets or log sensitive environment values.
- Do not expose internal stack traces to the frontend.
- Treat retrieved policy HTML as untrusted input; use it only for text extraction and never execute its scripts.

## 17. Allowed Files / Modules

May modify app-search modules, Play Store retrieval modules, permissions and Data Safety retrieval, privacy-policy retrieval, Cheerio cleaning, retrieval cache, retrieval-specific types, and retrieval-specific API handlers/routes where agreed.

Exact file paths remain **TO BE FINALIZED**. Shared types, root configuration, and integration route changes require coordination with Member 3.

## 18. Forbidden Without Team Agreement

Do not modify frontend pages/components/styles, Groq integration, AI prompts or schemas, comparison engine, scoring engine, risk-level logic, final report generation, frozen report fields, or unrelated shared configuration.

If a required change belongs to another teammate, report it instead of implementing it automatically.

## 19. Coding Agent Rules

- Stay within App Data / Retrieval ownership.
- Do not call Groq, create privacy conclusions, calculate scores, or generate mismatch judgments.
- Do not rewrite frontend or Privacy Engine modules.
- Do not rename API fields or independently change endpoint names.
- Do not introduce major new dependencies without agreement; follow TEAM_TASKS.md's agreement rule for new libraries.
- Do not refactor unrelated code.

For changes outside this role, **STOP that cross-team change** and report what is needed, why it is needed, and which teammate owns it. Prefer adapter-compatible output over rewriting another teammate's module.

## 20. Branch

Primary branch: **`feat/app-data`**. Do not develop directly on `main`. Pull/rebase from `main` before integration and coordinate shared-file changes.

## 21. Commit Rules

Use small logical commits and review `git diff` before committing. Examples:

- `feat: add Google Play app search`
- `feat: add permissions retrieval`
- `feat: add data safety retrieval`
- `feat: add privacy policy extraction`
- `fix: handle unavailable privacy policy`

Avoid vague messages such as `update`, `changes`, and `final`.

## 22. Completion Criteria

- [ ] App search works.
- [ ] Multiple matching apps are returned.
- [ ] Selected app metadata can be retrieved.
- [ ] Permissions are retrieved where available.
- [ ] Data Safety is retrieved where available.
- [ ] Privacy-policy URL is discovered where available.
- [ ] Privacy-policy HTML is fetched.
- [ ] Readable policy text is extracted.
- [ ] `sourceStatus` is returned correctly.
- [ ] Partial failures do not crash retrieval.
- [ ] In-memory cache works.
- [ ] Output follows `docs/API_CONTRACT.md` once finalized.
- [ ] Member 3 can consume the output.
- [ ] No AI/privacy scoring logic is duplicated.

Stop adding features when the retrieval MVP works; prioritize early integration and reliable handling of real source data.
