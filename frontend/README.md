# Priv Lab frontend

The Next.js App Router application lives in `src/app`. This foundation uses TypeScript, locally bundled Tailwind CSS, ESLint, and a shared accessible application shell.

## Local development

Next.js requires Node.js 20.9 or newer. For the full development toolchain, use a supported Node 22 release at least 22.13 or Node 24: a transitive lint dependency warns on Node 22.11.

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000. From the repository root, `npm run frontend:dev` starts the same application.

## Verification and production

```sh
npm run typecheck
npm run lint
npm run build
npm start
```

Production start serves the built application on port 3000. The root shortcuts are `frontend:check`, `frontend:build`, and `frontend:start`.

## Migration boundary

The root-level HTML files and `mock-data.js` in this directory are the legacy frontend. Next.js does not serve or import them. They remain as references until each real-data screen is migrated and verified.

The application contains live Google Play search, validated result cards, explicit app selection, and loading/error/empty states. After selection, the analysis action opens `/report/[appId]`, requests the live report once per mount/explicit retry, and displays available findings, source statuses, uncertainty, and linked evidence. Navigation cancels waiting in the browser; backend processing may continue. No demo fallback is used.

Analysis is proxied through `/api/analyze/[appId]` with a 120-second upstream timeout. Reports are schema-validated, their identity must match the requested app, and evidence references must resolve. Invalid responses produce an error rather than an invented report. External URLs are scheme-checked and text is rendered through React.

The score is deliberately withheld from the customer view while scoring methodology remains unresolved; the existing backend score/risk contract is unchanged. Partial reports also suppress the backend's potentially reassuring summary. This does not fix the underlying retrieval, extraction, comparison, or scoring audit findings.

Start Express on port 4000 before searching. Next.js proxies `/api/search` to Express using the server-only `BACKEND_API_URL` (default `http://127.0.0.1:4000`). Configure it in `frontend/.env.local` for another backend origin and restart Next.js. The browser uses a same-origin request; it does not need the backend URL or CORS configuration. Requests have a 20-second upstream timeout and validate response shapes. Empty or overlong queries return 400; upstream failures return 502 or 504.

Do not put Groq credentials in frontend configuration or `NEXT_PUBLIC_*` variables.

Follow `docs/SOURCE_OF_TRUTH.md` and the shared API contract. The project now has sole ownership per the user's direction; historical teammate boundaries do not block implementation.

## Foundation verification (2026-10-10)

- TypeScript, ESLint, and production build passed.
- Production dependency audit reported no vulnerabilities.
- Full dependency audit reported five high-severity findings in the development lint chain (`eslint-config-next` → Next ESLint plugin → `fast-glob` → `micromatch` → `braces`). The suggested automated fix downgrades the Next lint configuration to a different major version; it was not applied blindly. Resolve this tooling issue before final release.
- This verifies the application foundation, not live search, reports, browser accessibility, or overall customer readiness.

## Live report integration verification (2026-10-10)

- Frontend lint/build, root typecheck, and backend build passed.
- Live `/api/analyze/com.spotify.music` through Next.js returned a validated partial report: permissions unavailable, Data Safety unavailable, policy available, AI failed.
- `/report/com.spotify.music` returned HTTP 200. Full browser interaction/accessibility remains unverified.
- Backend AI failure status is now retained by report generation. Backend environment loading and retrieval adapter issues remain open; this run does not establish successful live AI extraction.

## Responsive and accessibility checks (2026-10-11)

Run `npm run build` followed by `npx playwright test`. Tests start an isolated production server on port 3100 and use installed Microsoft Edge. Search/report responses are synthetic fixtures, not live-data assertions.

- Four browser tests passed: search/report at widths 320, 768, and 1440 pixels, plus invalid-query, upstream-error, and empty-result states.
- Keyboard skip navigation, selection focus, completed-report focus, and evidence expansion passed.
- Long names and unbroken evidence text caused no horizontal overflow at tested widths.
- Axe WCAG A/AA scans reported no violations on the tested search/report fixtures. Reduced-motion mode was enabled for these tests.
- Lint and production build passed. Mobile screenshots were visually inspected.
- Manual screen-reader testing, additional browser engines, and a complete WCAG conformance audit remain outstanding.
