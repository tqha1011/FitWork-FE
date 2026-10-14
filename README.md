# FitWork frontend

React 19, TypeScript, Vite, and Tailwind. Use Node.js 24 or newer.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

API requests and processing sockets share the browser-safe `VITE_API_BASE_URL` environment variable. Set exactly one value in `.env.local` to switch backends:

```dotenv
# Local backend (default):
VITE_API_BASE_URL=http://localhost:3000/api
# Render backend (uncomment this and comment out the local value to switch):
# VITE_API_BASE_URL=https://fitworkbe-nestjs.onrender.com/api
```

Keep `/api` in the URL because services append their endpoint paths; sockets derive the backend origin automatically. Restart `npm run dev` after changing the value. Vite embeds it at build time, so deployed bundles must be rebuilt. For Docker builds, pass `--build-arg VITE_API_BASE_URL=https://fitworkbe-nestjs.onrender.com/api`.

Authentication pages are `/auth/sign-in` and `/auth/sign-up`; `/login` and `/register` redirect to them. Registration selects Freelancer (`APPLICANT`) or Client (`COMPANY`) and submits all five required DTO fields. A successful registration returns to sign-in with the email prefilled; it does not log in automatically.

The shared Axios client sends credentials for all four auth endpoints, omits `Authorization` on them, and reads their direct response objects. Login and refresh store the access token in memory and derive account identity and role from JWT claims. Reload restores the session with the HttpOnly refresh cookie. Protected calls attach the bearer token, refresh expired tokens or a 401 through one shared request, and retry at most once. Logout accepts an empty 204, clears the local session immediately, and waits for pending refresh/login before ending the server session. Login waits for earlier logins and a pending logout, preventing stale cookie responses from replacing the latest account session.

Both role dashboard routes redirect to `/jobs`. All Job routes require login. Freelancers can find Jobs and view `/freelancer/applications`; Clients can browse Jobs and publish at `/client/jobs/new`. `/account` shows JWT account identity. Profile APIs and password recovery remain unavailable in this integration.

Jobs use the real `/job`, `/categories`, `/skills`, and `/arrangements` APIs through the existing client (the base URL already includes `/api`). Search keeps title, category/skill IDs, VND budget filters and pagination in the URL; only title is debounced (300ms). Reference data is reused within the account session and cleared/cancelled on account change or logout. Job descriptions expand within the list because there is no detail endpoint in the integration contract. My Jobs, editing and applicant management await backend data sources.

Posting sends all eleven required fields, including `skillsId: []` when no skills are selected. Local deadlines are converted to UTC ISO strings. An empty 201 confirms creation without inferring a new Job ID. Closed jobs do not appear in search.

Apply loads every history page before enabling submission and rechecks before submitting. Amounts use the selected Job's currency. PDF/DOCX resumes (1 byte–5 MiB) follow `/resume/upload-url` → signed storage PUT → `/resume`. Storage PUT uses a separate transport without API JWT or credentialed cookies and sends the exact MIME type. A created resume is retained when applying fails; a successful application remains confirmed if history synchronization fails. Network, timeout and 500 mutations are never automatically resent; uncertain applies recheck all history pages before a user can submit again. No AI evaluation or ingestion wait is required. Matching score 0 is displayed as 0 without a percent or guessed rating; history currency/title appear only for Jobs actually loaded during the session.

**Backend prerequisite:** set the refresh cookie's creation and deletion path to `/api/auth`, replacing `/auth/refresh`. Otherwise the browser will not send it to refresh/logout. Remove any existing cookie at the old path during the backend migration. Allow the frontend's exact origin in CORS with credentials enabled. The current contract allows `http://localhost:5173`; if Vite selects another port, update CORS or free port 5173. Cross-site deployments also require compatible cookie `SameSite`/`Secure` settings and credentialed CORS.

Verification:

```sh
npm test
npm run lint
npm run build
```

Tests use Node's built-in runner and need no additional test framework. They cover DTO validation, registration without automatic login, JWT role handling, credentialed requests, concurrent and delayed 401s, expiry, bounded retry, invalid sessions, empty logout responses, and login/logout/refresh races.

Job tests additionally cover request URLs/DTOs, comma-separated filters, zero budget/zero pages, complete history traversal, session reference cache cancellation, file validation, storage credential separation, step failures and HTTP/request-ID errors.

Mocked browser regression checks are in `scripts/job-browser-smoke.mjs`. Run Vite at `http://127.0.0.1:5173` and use an existing Playwright installation (no application dependency was added):

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROMIUM_PATH=/absolute/path/to/chromium \
node scripts/job-browser-smoke.mjs
```

`JOB_UI_URL` and `JOB_QA_DIR` optionally override the frontend URL and screenshot directory (default `/tmp/fitwork-job-qa`). The suite mocks all API/storage traffic and verifies role guards, URL/back-forward/stale search, empty and out-of-range pages, OPEN/CLOSED creation, later-page duplicates, expired Jobs, upload failures, HTTP 400/403/404/500, network/timeout input retention, resume reuse and history recovery. It also verifies dialog keyboard focus and horizontal overflow at desktop, tablet, 390px and 320px.

Manual browser checks with the backend running:

1. Submit empty and invalid forms. Verify inline errors, focused error summary, password visibility, and keyboard navigation.
2. Register both account types. Verify `userType`, `username`, and `fullName` in the request; a 201 should return to sign-in without sending a login request.
3. Try a duplicate email and incorrect password. Verify visible 409/401 messages and retained form input. Test a disconnected API and 500 response as well.
4. Sign in with each role. Verify the correct account route, bearer header only on protected APIs, and a successful refresh after reload.
5. Trigger concurrent protected requests with an expired token. Verify one refresh request and one retry per request, with no recursive refresh after a failed refresh.
6. Sign out. Verify a credentialed POST, 204 without JSON parsing, cookie deletion, and guest redirection from protected routes. Check signing in while logout is pending.
7. Review login and registration at desktop, tablet, 390px, and 320px widths. Check for horizontal overflow and readable labels/errors.

Browser smoke verification during implementation uses mocked auth, Job and storage responses. The user confirmed the BE is not running because another service occupies its port; no live integration success is claimed. When BE is available, run these additional checks:

1. Set `VITE_API_BASE_URL` to the BE `/api` URL and allow the exact frontend origin with credentialed CORS. Confirm refresh-cookie creation/deletion uses `/api/auth`, then verify login, refresh after reload and logout in a real browser.
2. With real Client/Freelancer accounts and reference IDs, create OPEN and CLOSED Jobs, browse/filter, upload PDF/DOCX, apply, and verify the returned application in history. Ensure storage CORS permits PUT from the frontend origin with `Content-Type` and that PUT sends neither API bearer nor credentialed cookies.
3. Verify server-side deadline/status and duplicate enforcement. The FE only knows the loaded Job snapshot; reliable enforcement still belongs to BE.
