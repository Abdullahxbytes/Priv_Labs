# PrivacyLens — Project Audit and Implementation Plan

Date: 2026-10-10

## Audit status

The main modules exist, but the project is not yet a reliable end-to-end privacy scanner. Errors can hide real data, produce misleading scores, or replace results with mock reports.

The audit covered project directories, documentation, frontend flow, backend retrieval/integration, and Privacy Engine implementation. No application source files were changed during the audit.

Checks executed during the audit:

- Root TypeScript check: PASS.
- Comparison smoke test: PASS.
- Backend build: PASS.
- Live Groq and browser testing: NOT RERUN.

Passing these checks does not establish correct privacy findings. Findings below describe the audited implementation, not completed fixes.

## Governing documents and change rules

- [SOURCE_OF_TRUTH.md](SOURCE_OF_TRUTH.md) takes priority when project documents conflict.
- Follow [API_CONTRACT.md](API_CONTRACT.md), [ARCHITECTURE.md](ARCHITECTURE.md), [AI_SPEC.md](AI_SPEC.md), [DESIGN.md](DESIGN.md), [TEAM_TASKS.md](TEAM_TASKS.md), and the teammate role documents.
- Preserve the eleven frozen report fields: `app`, `score`, `riskLevel`, `sourceStatus`, `permissions`, `dataCollected`, `dataShared`, `mismatches`, `positiveFindings`, `summary`, `evidence`.
- Preserve risk values `LOW`, `MODERATE`, `HIGH`, and `VERY HIGH` unless the team explicitly agrees otherwise.
- Permissions are capabilities, not proof of collection. Missing data is neither proof of safety nor automatically a mismatch or penalty.
- AI extracts policy findings; deterministic code performs comparison and scoring.
- Use the configured production Groq model, OpenAI GPT-OSS 120B (`openai/gpt-oss-120b`), and keep model selection environment-configurable.
- Respect teammate ownership. Coordinate shared interfaces and prefer adapters over unrelated rewrites.
- Record major architecture, schema, AI, scoring, ownership, or storage decisions in [DECISIONS.md](DECISIONS.md). This plan does not itself finalize unresolved decisions.
- Update [TESTING.md](TESTING.md) only with actual results. Compilation success is not proof of correct findings or scores.
- Keep work within the documented MVP; no database or unrelated features.

Priority: **P0** = correctness/integration blocker; **P1** = required completion or reliability work after the blockers.

## 1. Frontend — Member 1

| Module | Finding or missing functionality | Planned correction | Priority |
| --- | --- | --- | --- |
| Live search/report | Search falls back to demo results. Reports begin with mock data and silently retain it when analysis fails or exceeds two seconds. | Make live requests the normal flow; show explicit failures and retry. Keep fixtures only in a clearly labeled demo mode. | P0 |
| Analysis progress | `analysis.html` marks steps complete using timers without backend evidence. | Show truthful general loading until actual results arrive; never invent completed stages. | P0 |
| Score presentation | UI supplies fallback `50 / MODERATE` and derives risk presentation from independent thresholds that differ from backend thresholds. | Display the backend's agreed score and risk label exactly. Handle insufficient evidence using the finalized contract. | P0 |
| Missing-source states | Empty sections say no special permissions or no third-party sharing. Empty mismatches produce reassuring alignment language. | Base empty-state wording on coverage; distinguish unknown from inspected absence. | P0 |
| Findings/evidence | Insufficiency notices are presented as possible inconsistencies. External/model text enters `innerHTML`. | Separate uncertainty from mismatch presentation; render untrusted text safely and validate links. | P0 |
| Framework | Static HTML/JavaScript differs from the agreed Next.js + TypeScript + Tailwind stack. | Port the existing interface to the documented stack while preserving design and behavior. An alternative requires a recorded team decision. | P1 |
| Usability verification | Responsive, keyboard, retry, repeat-search, and evidence interactions lack demonstrated coverage. | Verify these after live integration works. | P1 |

Primary files: `frontend/search.html`, `frontend/analysis.html`, `frontend/report.html`.

Completion checks:

- Live failures never silently become mock reports.
- Loading indicators reflect actual knowledge of progress.
- Scores and risk labels come from the backend contract.
- Missing sources and insufficiency notices do not imply safety or detected inconsistency.
- Untrusted content renders as text; evidence and navigation work with keyboard input.
- Test responsive layouts and repeat searches without stale results.

## 2. Backend — Member 2, coordinated with Member 3

| Module | Finding or missing functionality | Planned correction | Priority |
| --- | --- | --- | --- |
| Data Safety adapter | Code expects an array; the installed scraper returns an object with `collectedData`, `sharedData`, `securityPractices`, and `privacyPolicyUrl`. Valid data is treated as unavailable. | Adapt the verified runtime shape; preserve collection and sharing separately. Add a representative adapter fixture. | P0 |
| Permissions adapter | `short: 'false'` is truthy. The installed scraper returns short strings while our adapter expects objects and filters them out. | Correct the invocation and handle the verified returned shape. | P0 |
| Policy discovery | Developer website substitutes for a missing policy URL, potentially treating a homepage as a policy. | Use the actual policy link, including the Data Safety policy URL. Mark unavailable when a policy cannot be established. | P0 |
| Environment loading | Backend startup does not load `.env`; a local file alone does not configure Groq. | Load configuration deterministically at startup and validate AI settings without logging secrets. | P0 |
| Production startup | Build emits `backend/dist/backend/src/index.js`; `npm start` still targets `dist/index.js`. Old artifacts can mask this. | Align build output and startup commands; verify from a clean build. | P0 |
| Analysis orchestration | Route calculates AI failure status, but downstream reporting overwrites it. | Preserve retrieval and AI statuses independently throughout the pipeline. | P0 |
| Cache | Map has no expiry or size bound; partial failures can persist indefinitely. | Agree TTL, size, and retry behavior for failed sources; preserve real-data provenance. | P1 |
| Retrieval safety/errors | External policy requests lack explicit private-network restrictions and body-size limits. App IDs receive only an emptiness check. | Bound fetches, validate destinations/redirects and inputs, and retain structured errors. | P1 |
| Packaging/setup | Root and backend installations need coordination; backend metadata says ISC while project license is MIT. README setup is incomplete. | Align packaging, license metadata, and verified startup instructions. | P1 |

Primary files: `backend/src/retrieval/appDataRetrieval.ts`, `backend/src/policy/policyRetrieval.ts`, `backend/src/routes/analyzeRoute.ts`, `backend/src/index.ts`, `backend/src/cache/retrievalCache.ts`, `backend/package.json`, `backend/tsconfig.json`.

Completion checks:

- Scraper fixtures preserve real permissions, collection, sharing, security, and policy references.
- Absent sources remain distinguishable from successful empty results.
- Clean installation/build/start works without stale artifacts.
- Backend loads the intended local configuration and never prints credentials.
- Policy and AI failures remain separate in final source statuses.
- Cache reuse uses real retrieved data and follows the agreed freshness rules.

## 3. AI / Privacy Engine — Member 3

This area includes deterministic comparison, scoring, and reporting; these must remain separate from model judgment.

| Module | Finding or missing functionality | Planned correction | Priority |
| --- | --- | --- | --- |
| Scoring | Empty or insufficient findings return `100 / LOW`. Penalties and thresholds were implemented without the required agreed scoring specification. | Finalize `docs/SCORING.md`, minimum evidence, thresholds, duplicate handling, and insufficient-evidence representation before displaying scores. | P0 |
| Comparison | Collection and sharing are combined into one policy signal; Data Safety sharing is ignored. AI availability is not checked. | Compare collection and sharing independently using availability and explicit disclosure meaning. | P0 |
| Normalization | Precise Location and Geolocation information do not consistently normalize; raw permission identifiers are not used as fallback. | Establish one agreed mapping and test equivalent terms across sources. | P0 |
| Missing inputs | Null policy analysis can cause mismatches despite successful policy retrieval. Entirely empty inputs can return no insufficiency notice. | Use actual usable-source coverage, including AI status, and report uncertainty honestly. | P0 |
| Report assembly | Data Safety findings are omitted; AI failure becomes unavailable; empty comparisons produce reassuring summaries. | Preserve all usable sources and statuses; base summaries on coverage. | P0 |
| Evidence/positives | `not_found` evidence can become `found`; deletion details can become excerpts; positive findings can lack evidence; mismatch evidence IDs remain empty. | Preserve statuses and faithful excerpts, check evidence against policy text, and link supported findings to real evidence. | P0 |
| Extraction schema | Implemented output differs from AI_SPEC/API Section 16, including evidence representation and missing documented fields. | Reconcile through a documented adapter or agreed schema change; avoid competing contracts. | P1 |
| Prompt/validation | No evidence-text verification, explicit embedded-instruction defense, or prompt version. | Add documented safeguards and source-grounding checks. | P1 |
| Model/runtime | GPT-OSS 120B is selected, while request bounds and long-policy coverage still require production validation. | Document settings, bound requests/retries, and verify long-policy coverage handling. | P1 |
| Integration tests | Narrow smoke tests do not cover report correctness or partial failures comprehensively. | Test retrieval fixture through extraction result, comparison, scoring, and validated report; supplement with live verification. | P1 |

Primary files: `src/privacy-engine/comparison-engine.ts`, `scoring.ts`, `report-generator.ts`, `policy-extraction.ts`, `policy-extraction-schema.ts`, `policy-extraction-prompt.ts`, `groq-client.ts`.

Completion checks:

- Missing evidence never automatically yields a reassuring score or summary.
- Collection and sharing comparisons retain their separate meanings.
- AI failures do not become false disclosure mismatches.
- Evidence references resolve, excerpts match source text, and positive claims have support.
- Final report preserves all eleven frozen fields and agreed nested shapes.
- Scoring is deterministic under agreed rules and tested at thresholds and bounds.
- Eligible live Groq extraction and partial-failure behavior are verified separately from mocks.

## Implementation sequence

1. **Settle shared decisions:** scoring and insufficient-evidence representation, extraction schema, normalization, and model verification. Record decisions without silently changing frozen fields.
2. **Repair backend inputs:** permissions, Data Safety, genuine policy URL, environment loading, and startup paths.
3. **Repair engine correctness:** coverage handling, comparison semantics, evidence, report assembly, and agreed scoring.
4. **Connect truthful frontend behavior:** remove silent mock substitution, invented progress, independent scoring, and misleading empty states.
5. **Complete documented frontend stack and verification:** test complete, partial, failed-AI, cached, and no-mismatch cases, then at least two real apps end-to-end.

## Documentation reconciliation

- `docs/SCORING.md` is missing. Scoring decisions must be finalized rather than treating current code constants as approved rules.
- Several documents still say documentation-only, not implemented, or reference existing documents as planned. Update these statements based on actual verification.
- Reconcile static frontend implementation with the accepted stack decision.
- Reconcile implemented AI extraction shape with the shared specification.
- Document verified model identity, parameter count, eligibility, and settings.
- Update README setup and license metadata to match the project.
- Record actual verification in TESTING.md, preserving failed results and distinguishing live sources from fixtures.

## Release gate

Do not describe the project as fully working until the complete search → selection → retrieval → extraction → comparison → scoring → report flow passes with real data, and missing-source/AI-failure cases remain honest. Compilation and existing smoke-test success alone do not satisfy this gate.
