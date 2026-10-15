# PrivacyLens

**Know Before You Install**

PrivacyLens is a privacy-transparency tool designed to help users review
an Android app's available permissions, Google Play Data Safety
disclosures, and privacy policy in one place. It aims to highlight
supported possible inconsistencies and explain findings with evidence,
while making uncertainty and unavailable sources clear.

> **Project status:** Hackathon MVP in development. Features, model
> configuration, API schemas, scoring rules, and test outcomes must be
> confirmed against the final implementation before release.

## Table of Contents

-   [Problem](#problem)
-   [Solution and Core Features](#solution-and-core-features)
-   [How It Works](#how-it-works)
-   [System Architecture](#system-architecture)
-   [Technology Stack](#technology-stack)
-   [AI Component](#ai-component)
-   [Repository Structure](#repository-structure)
-   [Setup and Usage](#setup-and-usage)
-   [API](#api)
-   [Testing and Findings](#testing-and-findings)
-   [Limitations and Responsible Use](#limitations-and-responsible-use)
-   [Team Contributions](#team-contributions)
-   [License and Acknowledgements](#license-and-acknowledgements)

## Problem

Privacy information about mobile applications is spread across
permissions, Google Play's developer-provided Data Safety disclosures,
and privacy-policy documents. These sources can be difficult for users
to compare, and missing or unclear information can be hard to interpret.

## Solution and Core Features

PrivacyLens is intended to bring the available information together and
present it in a readable report.

Planned MVP capabilities include:

-   Search Google Play for Android apps and let the user select the
    intended app.
-   Retrieve available app metadata, permissions, Data Safety
    disclosures, and the privacy-policy URL.
-   Fetch and clean readable text from a privacy policy when available.
-   Use an eligible open-weight AI model to extract privacy-related
    statements from policy text.
-   Compare available sources using explicit rules and identify
    **possible** disclosure inconsistencies.
-   Generate a report with a 0--100 privacy score, risk level, summary,
    findings, and supporting evidence when sufficient data is available.
-   Show source availability and handle partial failures instead of
    treating missing data as proof of safety.

The exact behavior of the final implementation should be verified before
describing any feature as complete.

## How It Works

1.  **Search:** The user searches for an app and selects the correct
    result from multiple matches.
2.  **Retrieve app data:** The backend obtains available metadata,
    permissions, Google Play Data Safety information, and the
    privacy-policy URL.
3.  **Fetch policy:** If a policy URL is available, the backend fetches
    the page and extracts readable text.
4.  **Analyze policy:** The Privacy Engine sends cleaned policy text to
    the confirmed eligible AI model and validates the structured
    response.
5.  **Normalize and compare:** Findings are normalized and compared with
    available permission and Data Safety information.
6.  **Score and report:** Deterministic rules generate the score and
    risk level; the frontend presents the report and its evidence.

If a source is unavailable or analysis fails, the application should
preserve that status and report insufficient information where
appropriate. It should not invent facts or imply that a permission
proves data collection.

## System Architecture

``` mermaid
flowchart TD
    U[User] --> FE[Next.js Frontend]
    FE --> API[Express API]
    API --> SEARCH[Google Play App Search and Metadata]
    API --> RET[Permissions and Data Safety Retrieval]
    API --> POLICY[Privacy Policy Fetching and Cleaning]
    SEARCH --> DATA[Structured Retrieval Data]
    RET --> DATA
    POLICY --> DATA
    DATA --> ENGINE[Privacy Engine]
    ENGINE --> AI[Groq API with Confirmed Eligible Open-Weight Model]
    AI --> VALIDATE[Zod Output Validation]
    VALIDATE --> COMPARE[Normalization and Source Comparison]
    COMPARE --> SCORE[Deterministic Scoring and Report Generation]
    SCORE --> API
    API --> FE
    FE --> U
```

The diagram describes the intended architecture. Confirm actual module
boundaries and model configuration against the implementation before
submission.

## Technology Stack

  Area                               Technology
  ---------------------------------- -----------------------------------
  Frontend                           Next.js, TypeScript, Tailwind CSS
  Backend/API                        Node.js, Express, TypeScript
  Google Play retrieval              `google-play-scraper`
  HTML parsing and policy cleaning   Cheerio
  Retrieval cache                    In-memory JavaScript `Map`
  AI provider                        Groq API
  AI output validation               Zod
  Package management                 npm

These technologies are specified in the team implementation notes;
versions and exact configuration should be recorded from the
repository's package files.

## AI Component

-   **Provider/runtime:** Groq API.
-   **Model name and model ID:** OpenAI GPT-OSS 120B, `openai/gpt-oss-120b`.
-   **Parameter count:** 117B total parameters with 5.1B active parameters per token.
-   **Purpose:** Extract privacy-related disclosures from cleaned policy
    text into structured findings, with uncertainty and evidence where
    available.
-   **Validation:** AI output is treated as untrusted and validated with
    Zod before it is used by the comparison and scoring logic.
-   **Scoring:** The AI does not directly generate the final privacy
    score. The score and risk level are produced by deterministic rules
    agreed by the team.

The former 8B event restriction no longer applies. Keep the model ID in
`GROQ_MODEL` so deployments can change it without modifying source code.

## Repository Structure

The exact file layout may evolve during implementation. The team-owned
areas are:

-   **Frontend / UX:** search experience, loading states, report
    presentation, evidence display, and error states.
-   **App Data / Retrieval:** Google Play search and metadata,
    permissions, Data Safety, policy retrieval and cleaning, source
    statuses, and caching.
-   **Privacy Engine / Integration:** Groq integration, structured
    extraction, validation, normalization, comparison, scoring, report
    generation, and end-to-end integration.
-   **Documentation:** API contract, architecture/design decisions, AI
    specification, scoring rules, and team task notes.

## Setup and Usage

### Prerequisites

-   Node.js and npm versions compatible with the repository's package
    configuration.
-   Git.
-   A Groq API key for the AI analysis functionality.
-   Access to the repository and any required environment configuration.

### Installation

Clone the repository and install dependencies:

``` bash
git clone https://github.com/Abdullahxbytes/PrivacyLens.git
cd PrivacyLens
npm install
```

> **Important:** The team notes do not yet establish whether the
> repository uses a single root `package.json` or separate
> frontend/backend packages. If the project has separate package
> directories, run `npm install` in the relevant directories instead.
> Confirm the actual setup before treating these commands as final.

### Environment variables

Create the appropriate local environment file based on the repository's
configuration. The AI backend requires:

``` dotenv
GROQ_API_KEY=your_groq_api_key
```

Use a local `.env` file and keep real credentials out of source control.
Commit only variable names in `.env.example`; never commit API keys or
expose them to frontend code.

Add other environment variables only after confirming their names and
use in the codebase.

### Run the application

The exact development commands are **to be confirmed from the
repository's `package.json` files**. After installing dependencies and
configuring the environment, use the scripts defined by the project, for
example:

``` bash
npm run dev
```

Do not assume this command starts both frontend and backend; verify the
available scripts and run each service as documented by the
implementation.

### Basic usage

1.  Start the backend and frontend using the verified project scripts.
2.  Search for an Android app by name.
3.  Select the correct app from the results.
4.  Start the analysis and wait for retrieval and analysis to finish.
5.  Review the score, risk level, source statuses, findings, and
    evidence.
6.  Treat incomplete sources or analysis failures as limitations, not as
    proof that an app is safe.

## API

The team notes identify these intended frontend-facing endpoints. Exact
request and response schemas and error semantics are still to be
finalized in `docs/API_CONTRACT.md`.

### Search

``` http
GET /api/search?q=<app-name>
```

Searches for matching apps. Multiple results should be returned so the
user can select the correct app.

### Analyze

``` http
GET /api/analyze/:appId
```

Retrieves the selected app's available data and returns the final
analysis report.

The final report is intended to use these top-level fields:

-   `app`
-   `score`
-   `riskLevel`
-   `sourceStatus`
-   `permissions`
-   `dataCollected`
-   `dataShared`
-   `mismatches`
-   `positiveFindings`
-   `summary`
-   `evidence`

Refer to the finalized API contract for exact nested schemas, status
values, and error responses. Do not treat this list as a substitute for
the contract.

## Testing and Findings

Testing results have not been provided in the supplied team notes.
Complete this section with real test evidence before the final
submission; do not claim tests passed until they have been run.

Recommended test scenarios:

  -----------------------------------------------------------------------
  Scenario                Expected behavior       Actual result
  ----------------------- ----------------------- -----------------------
  Search for a common     Return multiple         To be tested
  Android app             matching results or a   
                          clear no-results        
                          response                

  Select a valid app ID   Return metadata         To be tested
                          available from the      
                          source                  

  Permissions or Data     Preserve source status  To be tested
  Safety unavailable      and continue with       
                          available data          

  App has no policy URL   Mark policy as          To be tested
                          unavailable without     
                          fabricating a URL       

  Policy page times out   Return a clear failure  To be tested
  or blocks retrieval     status without crashing 
                          the full flow           

  AI returns malformed    Validate output and     To be tested
  structured output       handle failure or       
                          partial analysis safely 

  One or more sources are Avoid unsupported       To be tested
  missing                 mismatch claims or      
                          reassuring scores       

  Complete                Frontend displays the   To be tested
  search-to-report flow   report returned by the  
                          backend                 
  -----------------------------------------------------------------------

Record the test input, expected output, observed output, pass/fail
status, and any issues. Replace each "To be tested" entry with the
actual result.

## Limitations and Responsible Use

-   Google Play Data Safety information is developer-provided disclosure
    data; it is not independent verification of actual runtime behavior.
-   Permissions indicate requested capabilities, not proof that data is
    collected, uploaded, or shared.
-   A privacy policy may be missing, inaccessible, blocked, or difficult
    to parse.
-   AI extraction can miss, misinterpret, or return invalid findings;
    validation and evidence checks reduce but do not eliminate this
    risk.
-   A missing statement is not proof that a practice does not occur.
-   A possible mismatch is not proof of misconduct. Reports should use
    cautious, evidence-based wording.
-   Scores depend on the available sources and the team's finalized
    deterministic scoring rules. Incomplete evidence must not be
    presented as certainty.
-   PrivacyLens is an informational tool, not legal advice or a
    guarantee of an app's real-world privacy behavior.

## Team Contributions

Replace the placeholders below with the team's agreed names and actual
contributions.

  -----------------------------------------------------------------------
  Team member             Role                    Contribution
  ----------------------- ----------------------- -----------------------
  `Mubashir`       Frontend / UX           Next.js interface, app
                                                  search experience,
                                                  progress states, and
                                                  privacy report UI

  `Muzammil`       App Data / Retrieval    Google Play retrieval,
                                                  permissions, Data
                                                  Safety, policy
                                                  fetching/cleaning, and
                                                  caching

  `Abdullah`       Privacy Engine /        Groq integration,
                          Integration             structured extraction,
                                                  validation, comparison,
                                                  scoring, report
                                                  generation, and
                                                  integration
  -----------------------------------------------------------------------


## License and Acknowledgements

**Project license:** **Project license:** PrivacyLens is released under the MIT License. See the `LICENSE` file in the repository for the full license text.

Third-party components and services include the technologies listed in the Technology Stack section. Their respective licenses and applicable terms should be reviewed, and required attributions included. The exact AI model's license and model card should also be documented.

Google Play data and privacy-policy content are retrieved from external sources. PrivacyLens preserves source attribution where appropriate and does not imply that these sources endorse the project.
