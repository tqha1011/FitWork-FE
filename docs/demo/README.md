# FitWork Demo frontend

Open `/demo` or use **Try demo** on sign-in. First entry creates a COMPANY workspace. A reload uses the existing single refresh initialization and restores the role from the JWT. An expired or logged-out demo requires **Start new demo**; it is never restarted automatically in that tab.

The demo screen calls the real API client (`withCredentials: true`). It does not import mock marketplace data. The UI uses `/demo/session` for role, jobs/CVs/applications, evaluation identities, quota and expiry. Applicant evaluation rooms use the existing Socket.IO transport; recruiter results use HTTP. Session polling every 15 seconds and foreground reconciliation cover missed notifications. Samples always open by `sampleEvaluationPublicId` and remain accessible while live AI is pending, failed, unavailable or quota-limited. Hiring transitions match the backend: pending → accepted/rejected; accepted → completed.

Auth cookie mutations are ordered against in-flight refresh. Role switch reserves its own refresh barrier before yielding, increments the FE generation, aborts protected requests and disconnects old sockets. Pending mutation tokens are retained only in memory so logout can send the newest bearer even when a newer sign-in supersedes local state. Providers remount after role changes. Failed switches recover from the rotated server cookie rather than reinstalling an obsolete token.

## Run against the dedicated backend

1. Prepare the backend per `FitworkBE-Nestjs/docs/demo/operations.md` on `feat/monitoring-evaluation`: separate database/Redis/bucket, migrations and sample PDFs. Enable the demo flags. Gemini configuration is needed only for live AI.
2. Set `VITE_API_BASE_URL` to its `/api` URL and run `npm run dev`. Public deployment uses one HTTPS origin for frontend, `/api` and `/socket.io`.
3. Open `/demo`, inspect all sample scores/CVs, switch to applicant, apply to both remaining jobs and run AI. Switch back to recruiter, inspect the LIVE result and accept/complete or reject. Reload in each role. Check expiry and explicit restart.
4. Exercise a 429, unconfigured AI (503), failed generation and an upload. Confirm samples remain accessible; uploads use the existing signed URL → storage PUT → create resume flow, with server quota and a 5 MiB file cap.

## Verification

```sh
npm test
npm run lint
npm run build

# Requires an installed Playwright module/browser; follows existing browser smoke scripts.
node scripts/demo-browser-smoke.mjs
```

Optional smoke settings: `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, `DEMO_UI_URL`, `DEMO_QA_DIR`. The browser smoke uses controlled API responses and writes screenshots under `/tmp/fitwork-demo-qa` by default. It covers company entry, CV, V2 zero score, role switches, apply, explicit samples during live processing/failure, 429/503, live results, hiring decisions, role restoration, mobile overflow, logout bearer, expiry and explicit restart. Service regression tests cover concurrent refresh/switch/logout/sign-in and obsolete HTTP/socket responses.

Validation in this workspace: unit tests, lint, build and browser smoke passed. The real backend was unavailable at `localhost:3000`; actual S3 CORS/presigned URLs, Gemini execution and public HTTPS remain deployment checks. Fixtures exist only in the smoke script, never in application code.
