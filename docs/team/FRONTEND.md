# Member 1 — Frontend / UX

> **This file defines the ownership boundary for the Frontend / UX teammate and their coding agent.**

## Mission

Build the complete PrivacyLens user experience: **search app → show search results → select app → show analysis progress → display privacy report**.

Consume agreed API contracts without duplicating backend, retrieval, AI, comparison, or scoring logic.

## Technology

Use **Next.js, TypeScript, and Tailwind CSS**. Do not introduce another frontend framework or styling system without team agreement. Keep implementation lightweight for the 2.5-hour MVP.

## Read First

Before implementation, the teammate and coding agent must read:

- [SOURCE_OF_TRUTH.md](../SOURCE_OF_TRUTH.md)
- [DESIGN.md](../DESIGN.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md)
- [TEAM_TASKS.md](../TEAM_TASKS.md)
- `docs/API_CONTRACT.md` once available; it does not yet exist.

If documents conflict, **SOURCE_OF_TRUTH.md has priority**. Report the conflict rather than silently changing shared decisions.

## Owns

- Landing page, app search UI, search results, app result cards, and app selection flow.
- Analysis/loading state and privacy report UI.
- Privacy score, risk level, source status, quick summary, permissions, data collected, and data shared displays.
- Mismatch cards, positive privacy findings, and evidence display.
- Frontend error states, responsive layout, and accessibility basics.
- Frontend API consumption, frontend-specific display types, and frontend styles.

## Does Not Own

Do not implement Google Play scraping, app metadata retrieval logic, permissions retrieval, Data Safety retrieval, privacy-policy fetching, or Cheerio cleaning; these belong to Member 2.

Do not implement Groq API calls, AI prompts, structured AI extraction, Zod validation for AI output, comparison logic, privacy score calculation, or risk-level calculation; these belong to Member 3.

Backend caching and backend business logic are also outside frontend ownership. Shared Express wiring and final analysis integration are coordinated by Member 3.

## Must Build

### 1. Landing Page

Include PrivacyLens branding, **“Know Before You Install”**, a short explanation, a large labeled search box, and a search action. Keep it minimal and focused.

### 2. Search Results

Show app icon, name, developer, and rating/category where available. The user must choose the correct app; never assume the first result is correct. Do not fabricate missing metadata.

### 3. Analysis / Loading Screen

Show meaningful steps: Finding application → Retrieving permissions → Checking Data Safety → Reading privacy policy → AI analyzing policy → Comparing disclosures → Calculating score → Generating report.

Support **complete**, **active**, **pending**, and **failed/unavailable** states. Continue displaying useful progress when a source fails. Do not invent completion from timers: step updates depend on the agreed API, whose progress mechanism is **TO BE FINALIZED**. Until supported, show truthful general activity. Keep backend implementation jargon out of user-facing labels.

### 4. Privacy Report Header

Show app icon, app name, developer, `score`, and `riskLevel`. Explain **100 = better privacy / lower risk; 0 = worse privacy / higher risk**.

Display **LOW**, **MODERATE**, **HIGH**, or **VERY HIGH** exactly as returned by the API. Do not calculate scores, thresholds, or risk labels in frontend code. Incomplete-input score representation remains **TO BE FINALIZED** in the shared contract; never substitute a reassuring number for a missing score.

### 5. Source Status

Use `sourceStatus` to display **Permissions**, **Data Safety**, and **Privacy Policy** availability. Possible statuses include `available`, `unavailable`, `failed`, and `cached`; exact schema and semantics belong in the API contract.

Missing data must not appear safe. Distinguish cached data from fresh retrieval where relevant, using supplied freshness information. Successful policy retrieval must not imply successful AI analysis.

### 6. Quick Summary

Display approximately 3–5 simple findings from `summary`, without inventing extra findings when fewer are available.

### 7. Permissions

Use understandable names such as Precise Location, Contacts, Camera, Microphone, Photos, Files, SMS, Calendar, and Nearby Devices. Explain requested access without treating it as proof of collection or granted access.

### 8. Data Collected

Display structured categories returned in `dataCollected`, with purposes and source attribution where supplied. Describe disclosures, not independently observed behavior.

### 9. Data Shared

Display recipients and sharing information returned in `dataShared`. Do not infer sharing from permissions or missing disclosures.

### 10. Privacy Mismatches

Make supported possible mismatches prominent. Use neutral wording: **Possible mismatch**, **Not clearly disclosed**, **Possible disclosure inconsistency**, or **Insufficient information**. Never display accusations. Missing sources alone are not a mismatch; preserve backend distinctions and evidence.

### 11. Positive Findings

Show `positiveFindings` separately. Supported examples include encryption mentioned, data deletion available, clear disclosure, and no major mismatch found. Qualify the latter by successfully compared sources; insufficient coverage must not become reassurance.

### 12. Evidence

Use expandable sections with source, relevant finding, and a short evidence excerpt. Do not show huge policy text by default. Preserve uncertainty and attribution; do not invent confidence values.

### 13. Error States

Handle no search results, search failure, analysis failure, partial reports, missing privacy policy, and unavailable AI analysis. Explain the problem plainly and offer **Retry** or **Search another app** as appropriate. Keep valid partial findings visible without presenting unknown values as verified empty results.

Across these screens, follow DESIGN.md for responsive layouts, readable contrast, labeled controls, keyboard access, visible focus, and evidence expansion. Risk meaning must use text/icons as well as optional color.

## Frozen Report Fields

Consume these top-level names without renaming them:

- `app`
- `score`
- `riskLevel`
- `sourceStatus`
- `permissions`
- `dataCollected`
- `dataShared`
- `mismatches`
- `positiveFindings`
- `summary`
- `evidence`

Exact nested schemas belong in `docs/API_CONTRACT.md`. Frontend display types must reflect the agreed contract rather than redefine shared response fields.

## Initial Development Strategy

Do not wait for the backend. Use centralized mock data matching the frozen report contract and build the complete UI against it first. Until nested schemas are agreed, treat mock shapes as provisional and coordinate them with the team; do not invent permanent schemas independently.

Keep API access isolated in a frontend client/helper so real responses can replace mocks with minimal changes. Do not scatter fetch logic throughout components. Clearly label mocks as development/test fixtures; never present them as live findings or real cached results.

## Suggested Components

`SearchBar`, `AppCard`, `AnalysisProgress`, `PrivacyScore`, `SourceStatus`, `QuickSummary`, `PermissionCard`, `DataCollectionCard`, `DataSharingCard`, `MismatchCard`, `PositiveFindingCard`, `EvidencePanel`, and `ErrorState`.

These are suggestions only. Use reusable Next.js/React components without overengineering.

## API Boundary

Expected frontend-facing endpoints:

- `GET /api/search?q=<app-name>`
- `GET /api/analyze/:appId`

Use the exact contract in `docs/API_CONTRACT.md` once finalized. While it is unfinished, use mocks and report missing interface decisions rather than inventing permanent schemas. Groq credentials and calls belong in the backend, never the frontend.

## Allowed Files

May modify frontend pages/routes, components, styles, API client/helper, frontend-specific display types, and assets. Exact directory paths remain **TO BE FINALIZED**; this list does not establish a new project layout. Coordinate shared types and root package/config changes with Member 3.

## Forbidden Without Team Agreement

Do not modify scraper modules, retrieval modules, policy-cleaning logic, Groq integration, AI prompts, comparison engine, scoring engine, backend cache, frozen report fields, shared architecture decisions, or root configuration unrelated to frontend.

If a required change belongs to another teammate, report it instead of implementing it automatically.

## Coding Agent Rules

- Stay within frontend ownership.
- Do not rewrite another teammate's module or modify backend logic to make frontend integration easier.
- Prefer contract-compatible adapters/helpers on the frontend side.
- Do not rename API fields.
- Do not introduce new major dependencies without team agreement; follow TEAM_TASKS.md's agreement rule for new libraries.
- Do not refactor unrelated files or modify architecture/scoring decisions.
- Review `git diff` before finishing.

If a requested change falls outside this role's ownership, **STOP that cross-team change** and report:

1. What change is required.
2. Why it is required.
3. Which teammate owns it.

Do not implement the cross-team change automatically.

## Branch

Primary branch: **`feat/frontend`**. Do not develop directly on `main`. Pull/rebase from `main` before integration and coordinate shared-file edits.

## Commit Rules

Keep commits small and descriptive. Examples:

- `feat: add app search UI`
- `feat: add analysis progress screen`
- `feat: add privacy report layout`
- `fix: handle missing source status`

Avoid `update`, `changes`, and `final`. Review diffs and never commit secrets.

## Completion Criteria

- [ ] User can search for an app.
- [ ] Multiple results can be displayed.
- [ ] User can select an app.
- [ ] Loading/analysis state works.
- [ ] Privacy report renders.
- [ ] Score and `riskLevel` display correctly.
- [ ] `sourceStatus` is visible.
- [ ] Permissions display works.
- [ ] Data collected display works.
- [ ] Data shared display works.
- [ ] Mismatch cards work.
- [ ] Positive findings display.
- [ ] Evidence can be viewed.
- [ ] Missing data does not break the UI.
- [ ] Error states are handled.
- [ ] UI works against mock report JSON.
- [ ] UI can be switched to real API responses.
- [ ] No backend logic was duplicated.

Stop adding features when the MVP responsibility works; prioritize the integrated flow over extra features.
