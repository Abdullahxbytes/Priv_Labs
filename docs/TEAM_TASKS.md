# PrivacyLens — Team Tasks

> **Each teammate and coding agent must read this file before making changes.**

This document divides high-level work for the three-person hackathon team to avoid duplicated work, reduce merge conflicts, clarify module and coding-agent boundaries, and make integration predictable. Follow [SOURCE_OF_TRUTH.md](SOURCE_OF_TRUTH.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [DESIGN.md](DESIGN.md).

## Team Structure

| Member | Role | Branch |
| --- | --- | --- |
| Member 1 | Frontend / UX | `feat/frontend` |
| Member 2 | App Data / Retrieval | `feat/app-data` |
| Member 3 | Privacy Engine / Integration | `feat/privacy-engine` |

| Member | Teammate name | GitHub username |
| --- | --- | --- |
| Member 1 | TO BE FILLED | TO BE FILLED |
| Member 2 | TO BE FILLED | TO BE FILLED |
| Member 3 | TO BE FILLED | TO BE FILLED |

These are assigned branch names, not confirmation that branches have already been created.

## Member 1 — Frontend / UX

**Owns:** landing/search UI, search results, loading/progress states, privacy report UI, privacy score display, source-status display, permissions UI, data collected UI, data shared UI, mismatch cards, positive findings, evidence display, frontend error states, responsive design, frontend API consumption, and styles.

**Uses:** Next.js, TypeScript, and Tailwind CSS.

**Does not own:** Google Play scraping, privacy-policy retrieval, Cheerio parsing, Groq integration, AI prompts, comparison logic, scoring logic, or backend retrieval logic. Display backend-provided scores and risk labels without independently recalculating them.

**Primary branch:** `feat/frontend`.

## Member 2 — App Data / Retrieval

**Owns:** app search, app metadata retrieval, Google Play retrieval, permissions retrieval, Data Safety retrieval, privacy-policy URL discovery, privacy-policy HTML retrieval, Cheerio policy text cleaning, retrieval caching, retrieval error handling, and source availability/status.

**Uses:** Node.js, Express, TypeScript, `google-play-scraper`, Cheerio, and an in-memory `Map`.

**Does not own:** frontend UI, Groq AI analysis, privacy scoring, comparison logic, final risk labels, or final report wording. Return source data, cleaned policy text, availability, and provenance through the agreed retrieval contract; semantic privacy-category normalization belongs to Member 3.

**Primary branch:** `feat/app-data`.

## Member 3 — Privacy Engine / Integration

**Owns:** Groq API integration, AI policy analysis and prompts, structured JSON output, Zod validation, privacy-category normalization, comparison engine, deterministic scoring, risk-level assignment, final report generation, module integration, and end-to-end testing.

**Uses:** Node.js, TypeScript, Groq API, and Zod; coordinates integration through the agreed Express API.

**AI model:** OpenAI GPT-OSS 120B (`openai/gpt-oss-120b`) through Groq. It is open-weight and used meaningfully for core policy analysis. The former 8B restriction no longer applies.

**Does not own:** frontend styling, Google Play scraper internals, or Cheerio policy-cleaning internals. Integration ownership does not authorize rewriting another member's module.

**Primary branch:** `feat/privacy-engine`.

## Shared API Boundary

Teammates communicate through agreed interfaces. Frontend-facing endpoints are:

- `GET /api/search?q=<app-name>`
- `GET /api/analyze/:appId`

Exact request/response schemas belong in `docs/API_CONTRACT.md`, which does not yet exist. Nested schemas, status semantics, error formats, and progress reporting remain **TO BE FINALIZED** together before integration.

Frozen final report fields:

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

These names must not be changed independently. Scoring is deterministic: **100 = better privacy / lower risk; 0 = worse privacy / higher risk**. Risk labels remain **LOW**, **MODERATE**, **HIGH**, and **VERY HIGH**; exact weights, thresholds, and incomplete-input behavior require agreement.

## Dependency Flow

**Member 2 — App Data / Retrieval → Member 3 — Privacy Engine → Member 1 — Frontend.** Search results also pass from the retrieval layer through the API to the frontend.

- Member 1 should initially use mock final-report JSON matching the agreed contract.
- Member 3 may initially use mock retrieval data matching the agreed contract.
- This allows all three members to develop their modules in parallel, then replace mocks with real integrations early.

Mocks are clearly labeled development/test fixtures, never real findings or fabricated cache entries. Live reports and cached fallback data must use previously retrieved real information with evidence and visible uncertainty. Missing data is not proof of safety or an automatic mismatch, and permissions do not prove collection.

## Shared Files and Responsibilities

High-conflict areas include root package/config files, the API contract, shared types, `.env.example`, the main integration route, root configuration, and common constants. Exact module paths are **TO BE FINALIZED**; these examples do not imply that files already exist.

**Member 3 is the integration owner.** Member 2 owns retrieval/search behavior; Member 3 coordinates shared Express wiring and the final analysis route. Coordinate shared-file changes before editing where practical, especially when both backend members need the same route or configuration file.

All members agree on shared interfaces, preserve evidence and safety rules, and verify their own module. Member 3 coordinates end-to-end testing; module owners resolve issues in their own areas. Use npm, Git + GitHub, and Markdown + Mermaid consistently. The MVP uses an in-memory `Map`, with no database unless explicitly agreed by the team.

## Git Rules

1. Nobody develops directly on `main`.
2. Use the assigned branches; pull/rebase from `main` before integration.
3. Do not edit another teammate's owned module without discussion.
4. Do not rename shared API fields independently.
5. Do not reformat unrelated files.
6. Keep commits small.
7. Review `git diff` before committing.
8. Never commit secrets. Keep `GROQ_API_KEY` and other secrets in environment variables/local `.env`; `.env.example` contains variable names only, without values.
9. Use descriptive commit messages such as `feat: add app search endpoint`, `feat: add privacy report UI`, and `feat: add policy analysis`. Avoid vague messages like `update`, `final`, or `changes`.
10. Avoid unrelated refactors during the hackathon.
11. Prefer adapters over rewriting another teammate's working code.
12. Structural, API, scoring, or AI-model changes require team agreement.
13. Record important shared changes in `docs/DECISIONS.md` once created.

## Coding Agent Rules

- Stay inside the assigned teammate's ownership area.
- If a requested change belongs to another teammate's module, do not implement it automatically; report the dependency or required cross-team change instead.
- Do not “fix” integration problems by rewriting another teammate's module.
- Prefer adapters and contract-compatible changes.
- Do not change frozen report fields.
- Do not introduce new libraries or major architectural changes without team agreement.
- Do not modify unrelated files merely because they could be improved.

## Integration Order

1. App Data / Retrieval
2. Privacy Engine
3. Frontend
4. End-to-end testing

This is integration order, not a requirement to delay parallel development. **Do not wait until the final minutes for the first integration.**

## Stop Conditions

Each member should stop adding new features once their MVP responsibility works. Prioritize **a working end-to-end flow over extra features**; use remaining time to resolve integration failures, verify partial-data behavior, and support the demo within existing ownership boundaries.

## Document Scope

Detailed teammate implementation steps, frontend component code, scraper code, AI prompts, scoring weights, and full API schemas belong in separate role/specification files. This document defines high-level ownership only; separate teammate role files are not being created yet.
