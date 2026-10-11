# PrivacyLens — Decision Log

> **This file records only important shared decisions that affect architecture, contracts, scoring, AI behavior, team boundaries, or the MVP.**

This log helps teammates and coding agents understand major decisions, their reasons, affected areas, and later changes. It is not for trivial coding choices.

## When to Add a Decision

Add an entry when the team changes or finalizes an API endpoint or schema, architecture, technology, AI provider/model or prompt behavior, scoring rule or threshold, source-status enum, team ownership, MVP scope, caching strategy, or error-handling strategy.

Do not log variable names, small UI tweaks, formatting, behavior-neutral bug fixes, minor refactors, or routine dependency updates.

## Decision Format

```markdown
## DEC-XXX — Short Decision Title

**Date:** YYYY-MM-DD

**Status:** Accepted

**Decision:**
What was decided.

**Reason:**
Why it was chosen.

**Impact:**
Affected modules, documents, or teammates.

**Supersedes:**
None

**Related Docs:**
- `docs/...`
```

Allowed status values are `Proposed`, `Accepted`, `Superseded`, and `Rejected`. When a decision is replaced, retain the old entry, mark it `Superseded`, and link the replacement. Never delete important history.

## DEC-001 — Product Scope

**Date:** 2026-10-10

**Status:** Accepted

**Decision:** PrivacyLens is a focused Android privacy-inspection MVP. It compares requested permissions, Google Play Data Safety declarations, and the privacy policy to produce an evidence-backed report. The MVP does not perform runtime monitoring, APK reverse engineering, malware detection, authentication, payments, or iOS support.

**Reason:** This scope delivers the core cross-source privacy comparison within the three-person, 2.5-hour hackathon while preventing unsupported claims about runtime behavior.

**Impact:** Defines the frozen user flow and boundaries for all three teammates and the frontend report.

**Supersedes:** None

**Related Docs:**
- `docs/SOURCE_OF_TRUTH.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN.md`

## DEC-002 — Finalized Technology Stack

**Date:** 2026-10-10

**Status:** Accepted

**Decision:** Use Next.js + TypeScript + Tailwind CSS for the frontend; Node.js + Express + TypeScript for the backend; `google-play-scraper` for Google Play retrieval; Cheerio for policy HTML cleaning; Groq API for AI; Zod for AI-output validation; an in-memory `Map` for caching; npm for package management; and Git + GitHub for version control.

**Reason:** The stack is lightweight, familiar, and fast to integrate during the hackathon, with clear boundaries between retrieval, analysis, and presentation.

**Impact:** Constrains implementation choices across all modules. No database or additional scraping framework is part of the MVP without a new team decision.

**Supersedes:** None

**Related Docs:**
- `docs/SOURCE_OF_TRUTH.md`
- `docs/ARCHITECTURE.md`
- `docs/TEAM_TASKS.md`

## DEC-003 — AI Model Constraint

**Date:** 2026-10-10

**Status:** Superseded

**Decision:** The core AI must use an open-source/open-weight model of 8B parameters or fewer through the Groq API. The exact model name, model ID, and parameter count remain **TO BE CONFIRMED** until verified on the hackathon Groq account.

**Reason:** The 8B event limit and meaningful open-model requirement are mandatory; avoiding an unverified model prevents false documentation and incompatible integration.

**Impact:** Member 3 must confirm the account-available model before implementation and record the confirmation. AI behavior must remain structured, evidence-grounded, and separate from scoring.

**Supersedes:** None. Replaced by DEC-009.

**Related Docs:**
- `docs/SOURCE_OF_TRUTH.md`
- `docs/AI_SPEC.md`
- `docs/API_CONTRACT.md`

## DEC-004 — Score Direction and AI Boundary

**Date:** 2026-10-10

**Status:** Accepted

**Decision:** Privacy scores use a 0–100 scale where **100 means better privacy / lower risk** and **0 means worse privacy / higher risk**. AI extracts policy information and evidence, but deterministic backend rules calculate the score and assign the risk level.

**Reason:** A consistent direction makes the report understandable and keeps subjective model output separate from reproducible scoring.

**Impact:** Member 3 owns comparison and deterministic scoring; Member 1 displays returned values and must not recalculate them. Exact weights, thresholds, and incomplete-input handling remain open.

**Supersedes:** None

**Related Docs:**
- `docs/SOURCE_OF_TRUTH.md`
- `docs/API_CONTRACT.md`
- `docs/AI_SPEC.md`

## DEC-005 — Frozen Final Report Fields

**Date:** 2026-10-10

**Status:** Accepted

**Decision:** The final report top-level fields are fixed as: `app`, `score`, `riskLevel`, `sourceStatus`, `permissions`, `dataCollected`, `dataShared`, `mismatches`, `positiveFindings`, `summary`, and `evidence`.

**Reason:** A frozen shared contract lets all teammates work in parallel and prevents integration breakage caused by independently renamed fields.

**Impact:** No teammate or coding agent may rename, remove, or independently add competing top-level fields. Major nested-schema changes require team agreement.

**Supersedes:** None

**Related Docs:**
- `docs/SOURCE_OF_TRUTH.md`
- `docs/API_CONTRACT.md`
- `docs/team/FRONTEND.md`
- `docs/team/PRIVACY_ENGINE.md`

## DEC-006 — Team Ownership and Integration

**Date:** 2026-10-10

**Status:** Accepted

**Decision:** Member 1 owns Frontend / UX on `feat/frontend`; Member 2 owns App Data / Retrieval on `feat/app-data`; Member 3 owns Privacy Engine / Integration on `feat/privacy-engine`. Member 3 is the integration owner.

**Reason:** Explicit boundaries reduce duplicated work and merge conflicts while giving one teammate responsibility for contract-compatible integration and end-to-end testing.

**Impact:** Teammates use adapters and agreed interfaces rather than rewriting one another's modules. Cross-boundary changes require discussion.

**Supersedes:** None

**Related Docs:**
- `docs/TEAM_TASKS.md`
- `docs/team/FRONTEND.md`
- `docs/team/APP_DATA.md`
- `docs/team/PRIVACY_ENGINE.md`

## DEC-007 — Partial Failure and Source Coverage

**Date:** 2026-10-10

**Status:** Accepted

**Decision:** If one source fails, continue with available sources where a useful report can still be produced. `sourceStatus` communicates coverage for permissions, Data Safety, privacy policy, and AI analysis. Missing data must not automatically create a mismatch, a score penalty, or a positive safety finding.

**Reason:** External retrieval and AI services can fail, and users must see honest uncertainty instead of a crashed flow or an invented conclusion.

**Impact:** Member 2 reports retrieval statuses; Member 3 reports AI status and preserves partial analysis; Member 1 displays each state clearly. The exact insufficient-evidence score representation remains unresolved.

**Supersedes:** None

**Related Docs:**
- `docs/API_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN.md`
- `docs/AI_SPEC.md`

## DEC-008 — No Database for the MVP

**Date:** 2026-10-10

**Status:** Accepted

**Decision:** Use an in-memory `Map` for retrieval caching. Cached values must come from previously retrieved real data, and cached status must remain distinguishable from fresh retrieval. Do not introduce a database unless the team explicitly changes this decision.

**Reason:** An in-memory cache improves demo reliability and avoids database setup during the short hackathon while preserving the real-data-only rule.

**Impact:** Member 2 owns retrieval caching; the cache is lost on process restart. Any storage change requires a new decision and updates to the architecture and team contract.

**Supersedes:** None

**Related Docs:**
- `docs/SOURCE_OF_TRUTH.md`
- `docs/ARCHITECTURE.md`
- `docs/team/APP_DATA.md`

## DEC-009 — Production AI Model Upgrade

**Date:** 2026-10-12

**Status:** Accepted

**Decision:** Remove the former 8B model limit and use OpenAI GPT-OSS 120B through Groq with model ID `openai/gpt-oss-120b`. The model is open-weight and has 117B total parameters with 5.1B active parameters per token. Keep the model configurable through `GROQ_MODEL`.

**Reason:** The project is no longer constrained by the hackathon model-size rule, and the larger production model provides stronger structured-output support for privacy-policy extraction. Its availability was verified through the configured Groq account.

**Impact:** AI configuration, extraction verification, deployment environment variables, architecture documentation, testing records, and setup instructions must use the selected model. AI remains evidence-grounded and does not calculate the privacy score.

**Supersedes:** DEC-003

**Related Docs:**
- `docs/SOURCE_OF_TRUTH.md`
- `docs/AI_SPEC.md`
- `docs/API_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Change Control

Future teammates and coding agents must add a decision before changing architecture, frozen API fields, major schema structure, the AI provider/model, prompt behavior, scoring weights or thresholds, score direction, team ownership, MVP scope, caching/storage strategy, or major error handling. Record replacements by marking the prior entry `Superseded`; do not silently change shared assumptions.

## Unresolved Major Decisions

These remain intentionally open because the referenced documents do not finalize them:

- Final AI prompt and generation settings.
- Scoring weights, thresholds, duplicate-penalty rules, and insufficient-evidence score/risk representation; `docs/SCORING.md` does not yet exist.
- Complete normalized category mappings, permission risk/expected-use rules, and detailed cache freshness metadata.
- Progress transport and exact retry/chunk-size behavior.
