# Member 3 — Privacy Engine / Integration

> **This file defines the ownership boundary for the Privacy Engine / Integration teammate and their coding agent.**

## Mission

Turn retrieved app privacy data into the final evidence-backed PrivacyLens report:

**Retrieval data → AI policy analysis → structured output validation → normalization → source comparison → deterministic scoring → final report → frontend.**

Member 3 is also the integration owner. Coordinate interfaces without taking over other teammates' modules.

## Technology

Use **Node.js, TypeScript, Groq API, and Zod**, integrating through the agreed Express API.

**AI model: TO BE CONFIRMED.** It must be open-source/open-weight, **maximum 8B parameters**, and available through the hackathon Groq account. Do not invent a model ID or assume availability. Record the exact name, ID, and parameter count once confirmed. AI must meaningfully perform core policy analysis, not only cosmetic summaries.

## Read First

Before implementation, read:

- [SOURCE_OF_TRUTH.md](../SOURCE_OF_TRUTH.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md)
- [TEAM_TASKS.md](../TEAM_TASKS.md)
- `docs/API_CONTRACT.md`
- `docs/AI_SPEC.md` if available
- `docs/SCORING.md` if available

The API contract, AI specification, and scoring document do not yet exist. Their exact schemas, prompts, weights, and thresholds remain **TO BE FINALIZED** together; do not invent permanent decisions independently. If documents conflict, **SOURCE_OF_TRUTH.md has priority**.

## Owns

- Groq API integration, AI policy-analysis prompt, and structured AI extraction.
- Zod validation and controlled AI retry/fallback handling.
- Privacy-category normalization, comparison engine, and mismatch detection.
- Deterministic privacy scoring and risk-level assignment.
- Final report generation and human-friendly explanations.
- Adapters between modules, integration, and end-to-end testing.

## Does Not Own

Do not implement frontend styling or page design; these belong to Member 1. Do not implement Google Play scraping internals, permissions retrieval, Data Safety retrieval, privacy-policy HTML retrieval, or Cheerio text cleaning; these belong to Member 2.

## Must Build

### 1. Groq Integration

Accept cleaned privacy-policy text from retrieval, send it to the confirmed eligible Groq model, and require structured JSON output. Store `GROQ_API_KEY` only in backend environment variables/local `.env`; never commit or expose it to the frontend. `.env.example` contains variable names only, without values.

### 2. Structured AI Extraction

Extract disclosed information about data collected, data shared, purposes, third parties, location, contacts, device identifiers, advertising, retention, deletion, security, and tracking.

Use `found`, `not_found`, and `unclear`. **`not_found` means information was not found in the inspected text; it does not prove the practice does not exist.** Exact extraction schema and prompt belong in `docs/AI_SPEC.md` once agreed.

### 3. Evidence

Retain supporting evidence for important AI findings where available: source references and short relevant excerpts, not entire policy sections. Preserve uncertainty and attribution through normalization and report generation. Do not invent evidence or claim runtime behavior has been observed.

### 4. Zod Validation

Treat AI output as untrusted. Parse and validate structured JSON with Zod before comparison or scoring. When invalid, attempt controlled parsing/retry where practical; revalidate any recovered output. Otherwise omit invalid findings and continue with partial analysis instead of crashing the report.

Retry limits, exact validation schema, and fallback details are **TO BE FINALIZED**. A fallback must not fabricate missing facts.

### 5. Normalization

Normalize terminology across sources: `ACCESS_FINE_LOCATION`, “Precise location,” and “Geolocation information” can map to `location`. Preserve provenance and meaning: a permission remains requested capability, not proof of collection.

Possible categories are `location`, `contacts`, `camera`, `microphone`, `photos`, `files`, `messages`, `personal_information`, `financial_information`, `health_information`, `device_identifiers`, and `app_activity`. Exact mappings remain **TO BE FINALIZED**. Retrieval owns consistent source-data structure; Member 3 owns semantic privacy-category normalization.

### 6. Comparison Engine

Compare permissions, developer-provided Data Safety declarations, and privacy-policy findings using agreed deterministic rules. Possible outcomes are `consistent`, `possible_mismatch`, `unclear`, and `insufficient_information`; exact encoding belongs in the API contract.

Do not automatically flag a mismatch when a source failed. Distinguish missing information from an inspected source's explicit declaration.

### 7. Mismatch Rules

Use cautious wording. For example, after successfully inspecting the relevant sources:

| Source | Finding |
| --- | --- |
| Permission | Contacts requested. |
| Data Safety | No contacts declaration found. |
| Privacy Policy | No contacts mention found. |

Possible explanation: “Contacts access is requested, but contact-data handling was not clearly identified in the available disclosures.”

This describes uncertainty rather than proving collection or misconduct. If sources could not be inspected, report insufficient information. Never say “The app steals contacts” or accuse a company of lying.

### 8. Deterministic Scoring

**AI must not generate the final score.** Apply agreed deterministic rules to validated findings and available sources.

Score: **0–100**, with **100 = better privacy / lower risk** and **0 = worse privacy / higher risk**. Risk labels: **LOW**, **MODERATE**, **HIGH**, and **VERY HIGH**.

Exact weights, thresholds, and incomplete-input behavior must follow `docs/SCORING.md` once finalized. Do not independently invent different scoring rules or return a reassuring score when evidence is insufficient.

### 9. Final Report

Generate the frozen top-level fields without renaming them:

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

Exact nested structures follow `docs/API_CONTRACT.md`. Preserve source availability and evidence; include supported positive practices as well as possible concerns. Do not add competing report schemas.

### 10. Human-Friendly Explanations

Translate technical findings into neutral, cautious, informative, non-accusatory wording. For contacts permission: “If you grant this permission, the app may be able to access information stored in your address book.”

Do not equate permissions with collection, developer declarations with independently verified behavior, or lack of findings with proof of safety. Preserve the report's AI-error and non-legal-advice limitations.

## Partial Data Handling

Continue using available sources when permissions, Data Safety, or the privacy policy are unavailable, or AI analysis fails. Skip policy analysis when no usable policy text exists. Do not fabricate findings or interpret missing data as safe.

Carry retrieval availability into `sourceStatus`. Conceptual statuses include `available`, `unavailable`, `failed`, and `cached`; exact semantics remain an API-contract decision. Policy retrieval success does not imply AI success, so preserve analysis failures separately through the agreed nested/error representation without independently adding frozen top-level fields.

If cached inputs are supplied, preserve their provenance and relevant freshness information; cache data must come from previously retrieved real sources. Retrieval caching remains Member 2's responsibility. Insufficient-input score/risk representation must be agreed before displaying results.

## Integration Owner Responsibilities

- Accept Member 2's retrieval output and adapt it to privacy-engine input.
- Expose the final report to Member 1 through the agreed API.
- Resolve schema mismatches with contract-compatible adapters and team coordination.
- Maintain compatibility with frozen fields and coordinate shared Express wiring and the final analysis route.
- Test the complete search-to-report flow, including partial-source and AI failures.

Prefer adapters over rewriting teammate modules. Coordinate shared-file edits before changing root configuration, shared types, or API contracts. Member 2 retains ownership of search/retrieval behavior; Member 1 retains frontend ownership.

## Allowed Areas

May modify Groq integration, AI analysis modules, Zod schemas for AI output, normalization, comparison engine, scoring engine, report generator, integration adapters, and shared integration types where agreed. Exact module paths are **TO BE FINALIZED**.

## Forbidden Without Team Agreement

Do not redesign the frontend, rewrite Google Play scraper internals or Cheerio policy retrieval, change frozen fields or score direction, add a database, introduce new core features, or replace Groq as the agreed provider. The MVP cache remains an in-memory `Map`.

**Do not choose a model larger than 8B parameters.** This is an event restriction, not a discretionary team preference.

## Coding Agent Rules

- Stay inside privacy-engine/integration ownership.
- Do not rewrite teammate modules when an adapter works.
- Do not modify frontend styling or duplicate retrieval logic.
- Do not rename API fields or let AI directly generate the score.
- Do not invent missing privacy facts or silently change scoring rules.
- Do not introduce major dependencies without agreement; follow TEAM_TASKS.md's agreement rule for new libraries.
- Do not refactor unrelated files.
- Review `git diff` before finishing; never commit secrets.

For a requested change outside this role, **STOP that cross-team change** and report what is needed, why it is needed, and which teammate owns it. Do not implement it automatically.

## Branch

Primary branch: **`feat/privacy-engine`**. Do not develop directly on `main`. Follow TEAM_TASKS.md for small descriptive commits, shared-file coordination, and pulling/rebasing from `main` before integration.

## Completion Criteria

- [ ] Retrieval input can be consumed.
- [ ] Groq policy analysis works with a confirmed eligible model.
- [ ] Structured AI output is validated.
- [ ] Evidence is retained.
- [ ] Privacy categories are normalized.
- [ ] Three-source comparison works.
- [ ] Missing sources are handled safely.
- [ ] Score is deterministic.
- [ ] `riskLevel` is generated from agreed rules.
- [ ] Frozen final report JSON is produced.
- [ ] Frontend can consume the report.
- [ ] End-to-end flow has been tested.
- [ ] No scraper/frontend logic is duplicated.

Prioritize the working end-to-end MVP over extra features; begin integration before the final minutes.
