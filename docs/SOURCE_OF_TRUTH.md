# PrivacyLens — Source of Truth

> **All teammates must read this before making structural or interface changes.**

## Product

**Know what an app knows about you before you install it.**

PrivacyLens is an AI-powered Android App Privacy Inspector. It helps users understand an app's privacy disclosures by cross-checking requested permissions, Google Play Data Safety declarations, and its privacy policy. Findings describe possible inconsistencies, backed by available evidence.

This is a three-person, roughly 2.5-hour hackathon MVP. Keep implementation and documentation focused on the flow below.

## Frozen MVP

1. Search for an Android application.
2. Show multiple search results so the user can identify the correct app.
3. Let the user select an application.
4. Retrieve application metadata.
5. Retrieve requested permissions.
6. Retrieve Data Safety declarations.
7. Retrieve the privacy policy and prepare its text for analysis.
8. Use AI to extract structured privacy information and supporting evidence.
9. Compare permissions, Data Safety declarations, and privacy-policy findings.
10. Calculate a privacy score using deterministic rules.
11. Display an understandable privacy report with evidence and limitations.

## Out of Scope

- APK reverse engineering
- Packet sniffing
- Runtime network interception
- Malware detection
- A full GDPR compliance engine
- iOS support
- Authentication
- Payments

## Shared Terminology

| Term | Meaning |
| --- | --- |
| Permission | Capability or access requested by an application. |
| Data Safety | Developer-provided store privacy declaration. |
| Privacy Policy | The company's privacy/legal disclosure. |
| Mismatch | A possible inconsistency between available sources; not proof of misconduct. |

## Evidence and Interpretation Rules

- Never claim a permission proves that data is collected.
- Never accuse companies of lying, stealing data, or other misconduct.
- Distinguish developer declarations from independently verified behavior. This MVP does not observe runtime behavior.
- Ground findings in retrieved sources and show supporting evidence where available.
- Represent missing or ambiguous information honestly: `found`, `not_found`, or `unclear`. `not_found` means information was not found in the inspected source; it does not prove the practice is absent.
- Show retrieval failures and incomplete source coverage. Missing data must not be presented as evidence of safety or as a confirmed mismatch.
- If cached data is used, distinguish it from freshly retrieved data where relevant. Cached results must come from previously retrieved real data and must never be fabricated.
- Explain that AI can make mistakes and the report is not legal advice.

## AI and Scoring Boundaries

AI analyzes privacy-policy text, extracts structured information, identifies evidence, and produces simple explanations. It must not invent missing facts or directly decide the final score.

The comparison engine cross-checks the three sources. The scoring engine uses deterministic rules to calculate a score from **0–100** and a risk label: **LOW**, **MODERATE**, **HIGH**, or **VERY HIGH**.

**100 = better privacy / lower privacy risk.** **0 = worse privacy / higher privacy risk.**

Exact scoring weights, risk thresholds, and handling of incomplete inputs must be agreed during implementation before scores are shown to users. Do not invent these independently in different modules.

- Use the strongest production-ready open-weight model available through the configured Groq account when it materially improves structured policy extraction.
- Open-source/open-weight AI must be used meaningfully in the core functionality, not only for cosmetic summaries.

**Provider: Groq API. Model: OpenAI GPT-OSS 120B (`openai/gpt-oss-120b`).** The selected open-weight mixture-of-experts model has 117B total parameters and 5.1B active parameters per token. The former 8B event restriction no longer applies. AI output must be structured JSON validated with Zod before use.

The final public repository must include an open-source license; the planned license is MIT.

## Finalized Technology Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js + TypeScript |
| Styling | Tailwind CSS |
| Backend/API | Node.js + Express + TypeScript |
| Play Store Retrieval | `google-play-scraper` |
| Policy Retrieval / HTML Cleaning | Cheerio |
| AI Provider | Groq API |
| AI Model | OpenAI GPT-OSS 120B (`openai/gpt-oss-120b`), open-weight |
| Validation | Zod |
| Cache | In-memory `Map` |
| Environment Configuration | `.env`; `.env.example` contains variable names only |
| Package Manager | npm |
| Version Control | Git + GitHub |
| Diagrams | Markdown + Mermaid |

Caching uses an in-memory `Map`. The MVP must not introduce a database unless the team explicitly changes this decision.

Secrets such as `GROQ_API_KEY` must be stored in environment variables, configured through `.env`, and never committed. `.env.example` must contain variable names only, with no secret values.

## Frozen Final Report Fields

**These field names must not be changed without team agreement.**

| Field | Purpose |
| --- | --- |
| `app` | Metadata identifying the selected application. |
| `score` | Deterministically calculated privacy score. |
| `riskLevel` | LOW, MODERATE, HIGH, or VERY HIGH. |
| `sourceStatus` | Retrieval status for each source: permissions, Data Safety, and privacy policy, so the frontend can show source availability or failure. |
| `permissions` | Requested permissions and understandable explanations. |
| `dataCollected` | Data collection findings from available disclosures. |
| `dataShared` | Data sharing findings from available disclosures. |
| `mismatches` | Evidence-backed possible inconsistencies between sources. |
| `positiveFindings` | Privacy-positive practices supported by available evidence. |
| `summary` | Short, consumer-friendly explanations of the findings. |
| `evidence` | Source references and excerpts supporting report findings. |

Nested schemas, missing-value behavior, and error responses must be agreed in the planned `docs/API_CONTRACT.md` before module integration. These top-level names are already fixed.

## Team Boundaries

| Role | Owns | Branch |
| --- | --- | --- |
| Member 1 — Frontend / UX | Search UI, results, loading states, report, components, and styles. | `feat/frontend` |
| Member 2 — App Data / Retrieval | App search, metadata, permissions, Data Safety, policy retrieval, text cleaning, and retrieval caching. | `feat/app-data` |
| Member 3 — Privacy Engine / Integration | AI extraction, normalization, comparison, scoring, report generation, and final integration. | `feat/privacy-engine` |

Member names and GitHub usernames are **TO BE FILLED**.

- Nobody develops directly on `main`; use the assigned feature branches.
- Discuss changes to another teammate's owned module before editing it.
- Agree on shared interfaces before integration. Prefer adapters at module boundaries over rewriting another teammate's code.
- Keep commits small, review diffs, and never commit secrets.
- Structural, API, model, or scoring changes require team agreement and an entry in the planned `docs/DECISIONS.md`.

## MVP Completion Criteria

- A user can search, select the correct app, and reach a report through the complete flow.
- The report distinguishes permissions, store declarations, and policy findings, with evidence and visible uncertainty.
- The score comes from agreed deterministic rules, not an AI-generated number.
- Retrieval failures and missing information are handled visibly.
- The final repository documents setup, exact AI model and parameter size, provider/runtime, AI usage, architecture/data flow, test findings, limitations, team contributions, license, and third-party acknowledgements.
