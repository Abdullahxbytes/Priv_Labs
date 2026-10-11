# PrivacyLens — Testing and Findings

> **This document records what was actually tested, what happened, and what is still limited or unverified.**

## 1. Purpose

Record scenarios, inputs, expected outputs, actual outcomes, status, observed issues, limitations, and demo-tested apps for the team and hackathon judges. The repository currently contains documentation only. **All 46 application scenarios below are NOT TESTED.** Documentation checks are not evidence that the product works.

Follow [SOURCE_OF_TRUTH.md](SOURCE_OF_TRUTH.md), [ARCHITECTURE.md](ARCHITECTURE.md), [API_CONTRACT.md](API_CONTRACT.md), [AI_SPEC.md](AI_SPEC.md), [TEAM_TASKS.md](TEAM_TASKS.md), and the three teammate role documents. SOURCE_OF_TRUTH.md takes priority. `docs/SCORING.md` does not yet exist; scoring expectations requiring exact rules cannot be verified until those rules are agreed.

## 2. Test Status Values

| Status | Definition |
| --- | --- |
| PASS | The test ran and expected behavior occurred. |
| FAIL | The test ran and expected behavior did not occur. |
| PARTIAL | The main flow worked but some data/source/feature was unavailable or incorrect. |
| NOT TESTED | The scenario has not been executed. |

A deliberate failure-handling test can PASS if the expected handling occurs. PARTIAL describes incomplete results relative to that test's expectations, not every report with a missing source.

## 3. Main Test Table

Replace “Not run” only after execution. Record the exact appId or fixture, date, tester, commit, and relevant evidence in Notes when running a case. Distinguish synthetic fixtures from live app tests.

| ID | Area | Scenario | Input | Expected | Actual | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T01 | Search | Valid app search | `Spotify` | Multiple relevant results where available. | Not run | NOT TESTED | Record selected package IDs. |
| T02 | Search | Ambiguous app name | Common name with multiple matches, to select | Multiple results; user chooses the correct app. | Not run | NOT TESTED | No automatic first-result selection. |
| T03 | Search | No matching app | No-match query/fixture | Empty result state handled cleanly. | Not run | NOT TESTED | API returns `results: []`. |
| T04 | Search | Empty query | Empty/whitespace query | Frontend prevents invalid search; direct API request returns structured 400 error. | Not run | NOT TESTED | `INVALID_QUERY`. |
| T05 | Search | Provider failure | Controlled Google Play failure | Structured error without app crash. | Not run | NOT TESTED | Do not disguise failure as no results. |
| T06 | Retrieval | App metadata | Valid selected appId | Correct name, developer/appId and icon/rating/category where available. | Not run | NOT TESTED | Nullable fields follow contract. |
| T07 | Retrieval | Permissions available | App/fixture with permissions | Permissions returned; readable names where practical. | Not run | NOT TESTED | Preserve raw identifiers. |
| T08 | Retrieval | Permissions unavailable | Missing or failed permissions source | `sourceStatus.permissions` accurately says unavailable/failed. | Not run | NOT TESTED | Not a verified empty permissions list. |
| T09 | Retrieval | Data Safety available | App/fixture with declarations | Structured Data Safety returned. | Not run | NOT TESTED | Developer declarations, not observed behavior. |
| T10 | Retrieval | Data Safety unavailable | Missing Data Safety source | Continue with available sources and accurate status. | Not run | NOT TESTED | Do not infer no collection/sharing. |
| T11 | Retrieval | Policy URL available | App listing with policy link | Actual policy URL retrieved. | Not run | NOT TESTED | URL alone does not mean text is available. |
| T12 | Retrieval | Policy URL missing | Listing without policy link | No fabricated URL; policy status unavailable. | Not run | NOT TESTED | AI skipped/unavailable. |
| T13 | Retrieval | Policy fetch success | Retrievable policy HTML | Readable cleaned policy text returned. | Not run | NOT TESTED | Preserve meaningful policy content. |
| T14 | Retrieval | Policy fetch failure | Timeout/blocking/failure fixture | Failure status; analysis continues where possible. | Not run | NOT TESTED | Keep other sources usable. |
| T15 | AI | Valid extraction | Cleaned policy; confirmed eligible Groq model | Structured JSON passes Zod. | Not run | NOT TESTED | Model/account and implementation pending. |
| T16 | AI | Clear collection statement | Policy explicitly stating location collection | Relevant category `found` with supporting evidence. | Not run | NOT TESTED | Quote must match supplied text. |
| T17 | AI | Information absent | Inspected text lacking target topic | `not_found`; no invented conclusion or proof of absence. | Not run | NOT TESTED | Record inspected coverage. |
| T18 | AI | Ambiguous wording | Ambiguous policy fixture | `unclear` with uncertainty preserved. | Not run | NOT TESTED | Do not force a definitive fact. |
| T19 | AI | Invalid JSON | Malformed/wrong-shape model response | Safe validation failure; at most one controlled malformed-output retry, then partial fallback. | Not run | NOT TESTED | Persistent invalid output sets AI failed. |
| T20 | AI | Groq unavailable | Controlled Groq failure | `sourceStatus.aiAnalysis` is failed; non-AI sources remain usable. | Not run | NOT TESTED | No fabricated policy findings. |
| T21 | AI | Long policy | Policy exceeding confirmed practical input limit | Privacy-relevant section selection works and an incomplete-analysis limitation is clearly recorded. | Spotify policy | PASSED | Verify selected evidence and visible limitation after model or tier changes. |
| T22 | Comparison | Three sources agree | Location permission; collection declared in Data Safety and policy | Consistent finding; no false mismatch. | Not run | NOT TESTED | Declarations must describe compatible practices. |
| T23 | Comparison | Permission not clearly disclosed | Contacts requested; inspected disclosures lack clear contacts handling | Possible mismatch/unclear disclosure with cautious wording. | Not run | NOT TESTED | Sources must have been successfully inspected. |
| T24 | Comparison | Data Safety/policy mismatch | Explicit no-sharing declaration versus advertising-partner sharing in policy | Possible disclosure mismatch with evidence. | Not run | NOT TESTED | Missing declaration is not explicit denial. |
| T25 | Comparison | Missing source | One unavailable source | No mismatch solely because the source failed. | Not run | NOT TESTED | Insufficiency notice is not a detected inconsistency. |
| T26 | Scoring | Determinism | Identical normalized input processed twice | Identical score and riskLevel. | Not run | NOT TESTED | Hold AI output and scoring rules constant. |
| T27 | Scoring | Upper bound | Input exercising maximum score | Score never exceeds 100. | Not run | NOT TESTED | Exact fixture awaits SCORING.md. |
| T28 | Scoring | Lower bound | Input exercising maximum penalties | Score never falls below 0. | Not run | NOT TESTED | Exact fixture awaits SCORING.md. |
| T29 | Scoring | Missing-source scoring | Unavailable source with otherwise usable inputs | No automatic penalty solely for unavailability. | Not run | NOT TESTED | Incomplete-evidence score representation pending. |
| T30 | Scoring | Positive findings | Supported positive-practice fixture | Adjustments follow SCORING.md. | Not run | NOT TESTED | Do not invent bonus weights. |
| T31 | Scoring | Double-count prevention | Same underlying issue represented by multiple findings | No unnecessary duplicate penalty. | Not run | NOT TESTED | Deduplication rule awaits scoring agreement. |
| T32 | Scoring | Risk thresholds | Scores at and around each agreed boundary | Correct riskLevel under SCORING.md. | Not run | NOT TESTED | Current enum uses `VERY HIGH`, not `VERY_HIGH`. |
| T33 | Report/UI | Complete report | Complete contract-compatible report | All frozen sections render correctly. | Not run | NOT TESTED | Frontend does not recalculate score/risk. |
| T34 | Report/UI | Partial report | Supported report with missing source | UI remains usable and limitations visible. | Not run | NOT TESTED | No made-up score defaults. |
| T35 | Report/UI | Source-status display | Available/unavailable/failed/cached fixtures | Each status displays accurately. | Not run | NOT TESTED | Include AI failure despite available policy text. |
| T36 | Report/UI | Evidence expansion | Findings with short evidence excerpts | Evidence can be expanded; huge policy text hidden by default. | Not run | NOT TESTED | Include keyboard operation. |
| T37 | Report/UI | Search another app | Completed report followed by new search | User can search/select/analyze another app. | Not run | NOT TESTED | No stale report under new app identity. |
| T38 | Report/UI | Responsive behavior | Desktop/tablet/mobile viewport sizes | No critical overflow; report remains usable. | Not run | NOT TESTED | Record actual viewport sizes. |
| T39 | API | Search shape | Search request | Response matches API_CONTRACT.md results envelope. | Not run | NOT TESTED | Check required/nullable fields. |
| T40 | API | Analysis shape | Supported analysis request | All eleven frozen top-level fields and correct nested shapes. | Not run | NOT TESTED | Include evidence ID references and enums. |
| T41 | API | Error shape | Invalid query/appId and controlled failures | Structured error code/message with appropriate HTTP status. | Not run | NOT TESTED | No stack traces or secrets. |
| T42 | API | Partial success | One source fails; useful report remains possible | HTTP 200 report with accurate sourceStatus. | Not run | NOT TESTED | Subject to agreed incomplete-input scoring rules. |
| T43 | Security/safety | No committed secrets | Repository contents and history at tested commit | No real GROQ_API_KEY or other credentials. | Not run | NOT TESTED | Variable names alone are not secret values. |
| T44 | Security/safety | Untrusted HTML | Policy fixture containing scripts | Scripts not executed; content used only for extraction. | Not run | NOT TESTED | Check retrieval and any UI rendering. |
| T45 | Security/safety | Unsupported claims | Permission-only source data | No claim of confirmed collection from permission alone. | Not run | NOT TESTED | Neutral, non-accusatory report. |
| T46 | Security/safety | Missing-data language | Unavailable-source fixture | Missing source shown as unavailable, not safe. | Not run | NOT TESTED | No reassuring empty-result defaults. |

## 4. Search Tests

**T01–T05** cover relevance, ambiguity, empty results, invalid input, and dependency failure. Record actual queries and returned app IDs; verify user selection rather than assuming the first result.

## 5. App Data Retrieval Tests

**T06–T14** cover metadata, permissions, Data Safety, policy discovery, fetching, and cleaning. Compare returned values to the actual retrieved sources. Note failed sources separately from explicit negative declarations.

## 6. AI Tests

**T15–T21** cover live Groq extraction, evidence, finding statuses, malformed output, outages, and long inputs. Record exact model name/ID/parameter count, prompt version, settings, and fixture or policy source. Verify `openai/gpt-oss-120b` through the configured Groq account; mock responses alone do not establish live AI success.

## 7. Comparison Tests

**T22–T25** include both agreement and possible inconsistency. Verify the engine distinguishes explicit declarations, ambiguous disclosures, and unavailable sources. Include at least one case where no mismatch should be generated.

## 8. Scoring Tests

**T26–T32** must use agreed deterministic rules. **100 = better privacy / lower risk; 0 = worse privacy / higher risk.** No AI-generated score is permitted.

**Current gap:** `docs/SCORING.md` is absent. Weights, thresholds, double-count rules, positive adjustments, and insufficient-evidence score/risk representation require agreement before exact expected numbers can be recorded. Do not use invented expectations or mark these tests PASS prematurely.

## 9. Final Report / Frontend Tests

**T33–T38** cover complete and partial reports, source status, evidence, repeat searches, and responsive behavior. Include accessible labels, visible focus, and risk text rather than color alone during UI checks. Centralized mock fixtures support development, but must be labeled; they do not replace live end-to-end testing.

## 10. API Contract Tests

**T39–T42** follow [API_CONTRACT.md](API_CONTRACT.md). Check all eleven frozen fields, the four final source-status keys, nullable values, valid evidence references, and the current `VERY HIGH` enum. Keep retrieval success distinct from AI success.

## 11. Security / Safety Tests

**T43–T46** verify secrets handling, untrusted policy HTML, factual attribution, and honest missing-data language. Record actual checks and evidence; this initial test plan does not certify that a secret scan or security review has run.

## 12. Demo Tested Apps

No real app has been recorded as tested. `TO BE TESTED` below is a demo-planning label, not an additional test-result status. Choose exact apps/package IDs and replace placeholders only after real execution.

| App | Why Chosen | Search | Retrieval | AI | Report | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Popular social app — TO BE SELECTED | Common privacy disclosures and sharing | TO BE TESTED | TO BE TESTED | TO BE TESTED | TO BE TESTED | Record exact package ID. |
| Music/media app — TO BE SELECTED | Familiar demo search and media use | TO BE TESTED | TO BE TESTED | TO BE TESTED | TO BE TESTED | Spotify is a search candidate, not a tested app. |
| Simple utility app — TO BE SELECTED | Simpler comparison case | TO BE TESTED | TO BE TESTED | TO BE TESTED | TO BE TESTED | Do not assume low risk from category. |
| App with sensitive permissions — TO BE SELECTED | Evidence and careful permission explanations | TO BE TESTED | TO BE TESTED | TO BE TESTED | TO BE TESTED | Permissions do not prove collection. |

## 13. Known Issues

No confirmed issues recorded yet.

Use the following template only for real observations; it is not an existing issue:

### Issue — template

**Observed:** TO BE FILLED from a real test, including its ID.

**Impact:** TO BE FILLED.

**Workaround:** TO BE FILLED; state if none is known.

**Status:** Open / Resolved — select after recording an actual issue.

## 14. Limitations

- Permissions do not prove actual data collection.
- Data Safety is developer-provided.
- Privacy policies may be vague or incomplete.
- External scraping can fail; policy sites may block retrieval.
- AI can misinterpret legal language; Groq availability can affect analysis.
- Long policies may require selective privacy-section analysis with visible coverage limitations.
- The system does not observe runtime behavior.
- The privacy score is heuristic, not legal/compliance certification.
- In-memory cached data can become outdated and is lost on process restart.

These are design limitations and external risks, not fabricated test observations.

## 15. Test Findings Summary

### What Worked

NOT TESTED — add only real results after execution.

### What Failed

NOT TESTED — preserve actual failures once observed.

### What Was Partial

NOT TESTED — record actual incomplete outcomes and affected sources.

### Most Important Demo Finding

TO BE FILLED AFTER REAL TESTING.

## 16. Demo Readiness Checklist

- [ ] Search works.
- [ ] Multiple results work.
- [ ] App selection works.
- [ ] Permissions retrieval works.
- [ ] Data Safety retrieval works.
- [ ] Privacy-policy retrieval works.
- [ ] AI analysis works.
- [ ] Zod validation works.
- [ ] Comparison works.
- [ ] Score works.
- [ ] Final report renders.
- [ ] Partial failures are handled.
- [ ] At least 2 real apps have been tested end-to-end.
- [ ] One fallback/cached demo app is available.
- [ ] No secrets are present.
- [ ] README reflects actual tested behavior.

Cached fallback must use previously retrieved real data, never fabricated demo results. Test cache reuse and its visible status; warm the in-memory cache for the demo after any process restart. No fallback app is currently confirmed. README does not yet exist.

## 17. Testing Rules

- Do not mark PASS unless the test was actually run; never invent documentation results.
- Preserve failed tests and record important bugs honestly. Record rerun details instead of erasing the original failure.
- Re-run critical tests after integration.
- Test real apps before the demo, including at least one partial-failure scenario and one no-mismatch case.
- Record fixture versus live-source execution, exact app ID, commit, tester, date, and supporting evidence without secrets.
- Keep NOT TESTED when prerequisites are absent; record the missing prerequisite in Notes.

Remaining verification gaps include the unimplemented application, unconfirmed Groq model/settings, missing scoring rules, unresolved input-coverage/freshness details, and a real cached fallback app. None imply a test has already failed.

## 18. Ownership

| Member | Testing responsibility |
| --- | --- |
| Member 1 — Frontend / UX | Frontend, UI, responsive behavior, and accessibility checks. |
| Member 2 — App Data / Retrieval | Search, retrieval, permissions, Data Safety, policy fetch/cleaning, and retrieval cache. |
| Member 3 — Privacy Engine / Integration | AI, comparison, scoring, API integration, and end-to-end tests. |

All three teammates participate in final demo testing. Module owners resolve issues within their boundaries; Member 3 coordinates integration.
