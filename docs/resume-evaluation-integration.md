# Resume and evaluation frontend integration

## Routes and usage

- Applicant `/freelancer/resumes`: fetch the active saved collection using `GET /api/resume?pageNumber=1&pageSize=20`, including after reload. Pagination is held in the URL and normalized to positive integers with pageSize at most 100. The backend orders newest first and identifies the owner from JWT; no user ID is sent. Refresh list, upload, replace, download and delete are available. Successful upload/replacement/deletion refreshes the saved list. Empty collections and pages without items have distinct states; list failures have a retry action.
- **View details** calls `GET /api/resume/:resumePublicId` using the public ID from the list. It displays current filename, format, byte size, timestamps and processing status. Null ingestion fields show **Not processed yet** without starting a socket. Existing PENDING/PROCESSING/COMPLETED/FAILED metadata is still visible; workers update a known ingestion through the existing socket. Detail errors have a retry action and reads abort on close/navigation.
- PDF **Preview** obtains a fresh URL from `GET /api/resume/:resumePublicId/download-url?disposition=inline` each time. DOCX uses Download. Saved metadata does not contain a storage key, so failed-ingestion **Retry reading** is available only when this session knows the upload storage key; recovered CVs can be replaced with a new file instead.
- Existing Apply dialog accepts an available resume loaded from My Resumes or a new upload. Application submission and evaluation creation are separate requests. After successful apply, evaluation requires the selected resume's current ingestion to be COMPLETED.
- `/freelancer/applications`: **View evaluation** expands the latest result in the application card without navigating away. It uses the application's job public ID and works without session resume/ingestion/evaluation references, including after reload, replacement or deletion of a session resume. **Hide evaluation** collapses and cancels the read; reopening or refreshing requests the latest result again. Results are loaded on demand independently for each application. Creating an evaluation and retrying worker failure still require an available resume with a confirmed completed ingestion.
- Applicant `/freelancer/evaluations`: enter a **Job ID**. `/freelancer/evaluations/:jobPublicId` opens the latest result directly. The successful Apply dialog also displays evaluations inline.
- Both viewers call `GET /api/applicant-evaluation/:jobPublicId` using the existing bearer-token client, with no body or query. The backend identifies the applicant from JWT and selects the latest evaluation; the response `publicId` is the evaluation ID, not the job ID. No frontend result cache is used. HTTP 409 removes any old completed score and shows an incomplete-latest-result message with manual refresh; 404 reports missing job/application/evaluation; 403 disables further result requests. Existing session refresh/sign-in handling covers 401; network and 500 errors allow retry. Collapse, unmount and route changes abort obsolete reads; account changes clear the view.
- Company `/client/evaluations`: explains the missing applicant-list source.
- Company `/client/jobs/:jobPublicId/evaluations/:evaluationPublicId`: loads only the job-owner result; no applicant sockets or CV download. Real IDs must come from backend data supplied to the caller.

UI copy displays data, status and actions without backend dependency explanations or internal request diagnostics.

## Configuration

Set `VITE_API_BASE_URL=http://localhost:3000/api` as in `.env.example`. Services append routes without repeating `/api`; sockets derive the origin and connect to `/resume` and `/evaluation` with `/socket.io` as transport path. Local Vite and API origins need the backend CORS configuration described in the contract. Signed storage CORS is separate.

`socket.io-client` is a runtime dependency. API bearer tokens and credentialed cookies stay off signed storage requests. Resume and evaluation references are scoped to the authenticated workspace and reset on logout/reload. Visiting My Resumes recovers saved resume references from the API. The rendered page uses the backend list, with no persistent browser metadata cache.

## Realtime behavior

Join snapshots and notifications use the same ID/timestamp filter. Resume replacement switches ingestion ID; timestamps are compared by parsed time. Reconnect rejoins; session token refresh creates a connection with the new raw token. Disconnect or 20 seconds without a confirmed processing update reports uncertainty without inventing a FAILED status. Manual reconnect is available. On unmount/delete the resume watcher leaves and disconnects; evaluation watchers disconnect without an invented leave event.

GET evaluation 409 is distinct from task state. An open applicant view refetches by job ID when the monitored evaluation completes; an immediate GET after POST supports reused results. FAILED retries use the same POST pair. Evaluation public IDs remain necessary for the realtime join, not for reading results. An older COMPLETED snapshot is suppressed when the latest-result GET returns 409. Score zero renders normally. Each breakdown/evidence schemaVersion is handled independently; V2 score contributions match evidence by criterionId, and criteria render even without the V1 summary fields. Evidence snippets show the source section. Internal processing/evaluation IDs and character offsets are not displayed. Company redacted text is shown as text, including an explicit unavailable state for null.

Uncertain registration failures block another registration in the same dialog because a CV may already have been saved. Forms retain their input. HTTP 403 evaluation results disable further request/reconnect controls. No mutation is automatically retried on 500.

## Backend dependencies

Evaluation list/status, company applicant list, and company evaluation IDs are still unavailable. Resume list/detail APIs supply saved metadata and the current ingestion ID/status. Applied history supplies job IDs, so existing results can now be viewed after reload without recovering evaluation or ingestion IDs. New evaluation creation needs an available resume reference, recovered from My Resumes or a current upload. Company evaluation lookup remains on its separate job-owner endpoint carrying both job and evaluation IDs.

## Verification

`scripts/resume-list-browser-smoke.mjs` covers saved CV loading/reload, detail reads, null/failed ingestion metadata, fresh previews, pagination/back navigation, empty/out-of-range pages, 400/500/network retries, invalid pagination normalization, 375px/320px layout, delete reconciliation and canceled reads on navigation. Use the same Playwright environment variables below. Screenshots default to `/tmp/fitwork-resume-list-qa`; `RESUME_LIST_QA_DIR` overrides it. HTTP/storage responses are mocked.

Run `npm test`, `npm run lint`, and `npm run build`.

`scripts/resume-browser-smoke.mjs` tests UI against mocked HTTP/storage and a real local Socket.IO test server. It uses the same external Playwright module/executable environment pattern as the existing job browser test. Set `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, and optionally `SOCKET_IO_SERVER_MODULE` to installed test tooling; set `JOB_UI_URL` if Vite is not at http://127.0.0.1:5173. Test tooling paths are environment values, not project dependencies. Screenshots default to `/tmp/fitwork-resume-qa`.

Automated browser coverage: upload and immediate completed snapshot, stale ingestion filtering, fresh preview URLs, replacement and failed-ingestion retry, apply with existing resume, evaluation failure/retry, zero score, reordered criterion IDs, inline application results after resume replacement/deletion/reload, 375px layout, DELETE 204, uncertain-registration retry prevention, company V1 results/null redacted text and empty results state.

`scripts/applicant-evaluation-browser-smoke.mjs` covers lazy inline reads with no session references, independent application cards, latest-result refresh, 409 hiding an old score, collapse/reload, the Job ID lookup form, keyboard submission, V1/reload, V2 criteria and citations with score zero, 375px/320px layouts, 403/404/500/network errors, loading/stale requests, browser back/forward and sign-in/role guards. Start Vite, then run `node scripts/applicant-evaluation-browser-smoke.mjs` with `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` pointing to installed tooling as above. `EVALUATION_QA_DIR` overrides `/tmp/fitwork-applicant-evaluation-qa`. HTTP responses are mocked; this verifies frontend behavior rather than live backend ownership/cache/worker behavior.

For live backend verification, sign in with actual applicant/company accounts and use real files and jobs. Confirm storage upload/preview CORS, real worker transitions, disconnected/reconnected transport, token refresh during processing, applicant evaluation after apply, job ownership, and company access with backend-supplied IDs. The browser smoke uses controlled fixtures and does not establish real storage/worker/LLM availability.
