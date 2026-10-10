# Resume and evaluation frontend integration

## Routes and usage

- Applicant `/freelancer/resumes`: upload named PDF/DOCX, observe ingestion, replace with a new storage key, retry failed reading, preview PDF, download and delete.
- Existing Apply dialog accepts a session resume or a new upload. Application submission and evaluation creation are separate requests. After successful apply, evaluation requires the selected resume's current ingestion to be COMPLETED.
- `/freelancer/applications`: evaluate the resume attached to each application, retry worker failure and read V1/V2 results. Session evaluation references are retained when navigating between pages.
- Company `/client/evaluations`: explains the missing applicant-list source.
- Company `/client/jobs/:jobPublicId/evaluations/:evaluationPublicId`: loads only the job-owner result; no applicant sockets or CV download. Real IDs must come from backend data supplied to the caller.

## Configuration

Set `VITE_API_BASE_URL=http://localhost:3000/api` as in `.env.example`. Services append routes without repeating `/api`; sockets derive the origin and connect to `/resume` and `/evaluation` with `/socket.io` as transport path. Local Vite and API origins need the backend CORS configuration described in the contract. Signed storage CORS is separate.

`socket.io-client` is a runtime dependency. API bearer tokens and credentialed cookies stay off signed storage requests. Resume and evaluation references are scoped to the authenticated workspace, reset on logout/reload, and are not stored as an authoritative server collection.

## Realtime behavior

Join snapshots and notifications use the same ID/timestamp filter. Resume replacement switches ingestion ID; timestamps are compared by parsed time. Reconnect rejoins; session token refresh creates a connection with the new raw token. Disconnect or 20 seconds without a confirmed processing update reports uncertainty without inventing a FAILED status. Manual reconnect is available. On unmount/delete the resume watcher leaves and disconnects; evaluation watchers disconnect without an invented leave event.

GET evaluation 409 is distinct from task state. Applicant completion fetches detail, and an immediate GET after POST supports reused results. FAILED retries use the same POST pair. Score zero renders normally. Each breakdown/evidence schemaVersion is handled independently; V2 score contributions match evidence by criterionId. Evidence snippets do not highlight the original document. Company redacted text is shown as text, including an explicit unavailable state for null.

Uncertain registration failures block another registration in the same dialog because a CV may already have been saved. Forms retain their input. HTTP 403 evaluation results disable further request/reconnect controls. No mutation is automatically retried on 500.

## Backend dependencies

A complete resume list, resume metadata/recovery, ingestion status over HTTP, evaluation list/lookup/status, company applicant list, and company evaluation IDs are still unavailable. Upload references and evaluation IDs are only known in the current session. Applied history supplies resume IDs but not ingestion references or evaluation IDs; the UI explicitly explains why evaluation is unavailable after losing those references. No placeholder candidates, IDs or unsupported API routes are introduced.

## Verification

Run `npm test`, `npm run lint`, and `npm run build`.

`scripts/resume-browser-smoke.mjs` tests UI against mocked HTTP/storage and a real local Socket.IO test server. It uses the same external Playwright module/executable environment pattern as the existing job browser test. Set `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, and optionally `SOCKET_IO_SERVER_MODULE` to installed test tooling; set `JOB_UI_URL` if Vite is not at http://127.0.0.1:5173. Test tooling paths are environment values, not project dependencies. Screenshots default to `/tmp/fitwork-resume-qa`.

Automated browser coverage: upload and immediate completed snapshot, stale ingestion filtering, fresh preview URLs, replacement and failed-ingestion retry, apply with existing resume, evaluation failure/retry, zero score, reordered criterion IDs, application history, 375px layout, DELETE 204, uncertain-registration retry prevention, company V1 results/null redacted text and backend-dependency state.

For live backend verification, sign in with actual applicant/company accounts and use real files and jobs. Confirm storage upload/preview CORS, real worker transitions, disconnected/reconnected transport, token refresh during processing, applicant evaluation after apply, job ownership, and company access with backend-supplied IDs. The browser smoke uses controlled fixtures and does not establish real storage/worker/LLM availability.
