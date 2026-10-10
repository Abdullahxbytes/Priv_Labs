# Frontend Handoff — App Data / Retrieval

The retrieval layer on `feat/app-data` is ready for frontend search integration.

## Available Now

### Search apps

`GET /api/search?q=<app-name>`

Example:

```text
GET /api/search?q=spotify
```

Successful response:

```json
{
  "results": [
    {
      "appId": "com.spotify.music",
      "name": "Spotify: Music and Podcasts",
      "developer": "Spotify AB",
      "icon": "https://...",
      "rating": 4.3,
      "category": "Music & Audio"
    }
  ]
}
```

The user must select an app from the returned results; do not auto-select the first one.

An empty or whitespace-only query returns HTTP 400:

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "A non-empty search query is required."
  }
}
```

No matches returns HTTP 200 with `{ "results": [] }`.

## Not a Frontend Endpoint Yet

`GET /api/retrieve/:appId` is available for development/testing, but it returns raw retrieval data only. It is intended for Member 3 to consume while implementing the final analysis pipeline.

Do not build the report UI around this endpoint as its final frontend response.

## Final Endpoint to Prepare For

Member 3 will provide:

```text
GET /api/analyze/:appId
```

It will return the final report contract documented in `docs/API_CONTRACT.md`, with these fixed top-level fields:

```text
app, score, riskLevel, sourceStatus, permissions, dataCollected,
dataShared, mismatches, positiveFindings, summary, evidence
```

Until then, keep the report UI connected to a centralized mock fixture matching that contract.

## Important UI Rules

- A permission is requested capability, not proof of data collection.
- Missing/unavailable sources are not evidence that an app is safe.
- Display `sourceStatus` clearly once the final report is integrated.
- Use neutral wording for possible mismatches and uncertainty.
- The frontend displays the backend score and `riskLevel`; it must not calculate either.

## Current Retrieval Caveat

Privacy-policy URL discovery needs integration testing. The scraper may expose a developer website rather than a dedicated privacy-policy URL, so policy coverage can be unavailable or incomplete. The final UI must show that limitation through source status rather than treating it as a clean policy result.

## Backend Setup

From `backend/`:

```bash
npm install
npm run dev
```

The API listens on `http://localhost:4000` by default.

