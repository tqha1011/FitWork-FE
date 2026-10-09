# Job API implementation record

Source: the user-provided “Tích hợp Job UI với API thật” plan; API details verified against `FitworkBE-Nestjs/docs/api/job.md` and resume controller/DTOs.

- Baseline: `npm test` passes; existing uncommitted auth implementation must be preserved.
- Workspace decision: work on `feature/job-api-integration` in the existing workspace because the required auth implementation is uncommitted here. No auth changes are discarded or committed on the user's behalf. The branch inherits the current auth branch rather than dropping these prerequisites by checking out develop.
- Shared interfaces: HTTP DTOs → services → session-scoped Job state → protected pages. `estimatedDay` is the request field; `estimatedDays` is the response field. Application amounts use the selected job's currency. Search budget filters use VND.
- Tasks: HTTP services/reference cache; validation/upload; shell/search/create; apply/history; verification and review.
- No backend modifications or unsupported management routes.
- HTTP/reference/validation/upload: 26 tests pass including the existing auth regressions. Mutation request bodies, empty responses, comma filters, history traversal, session cache invalidation and separate storage transport covered.
- Shell/search/create/apply/history implemented; initial lint and production build pass.
- The API at localhost:3000 is not currently reachable. Live cookie/CORS/storage verification remains separate from mocked browser verification.
- Final independent read-only review: no Critical/Important code defects found. README updated as part of the requested integration documentation. `pageSize` defaults to 20 but remains configurable through URL because the plan specifies a default and the contract accepts it.
- Review boundary: existing auth implementation remains covered by its regression suite; live cookies/CORS/storage configuration cannot be assessed without the running BE. The user confirmed BE is stopped because another service occupies its port. Screenshots were inspected separately from the code review.
- Browser regression: 18 groups pass, including keyboard Tab/Escape/focus restoration, desktop/tablet/390px/320px, responsive create/apply forms, account/logout, later-page duplicates, failed later history page, 201 followed by sync failure, uncertain success reconciliation, network/timeout and HTTP 400/403/404/500 input retention, upload-step failures, resume reuse, role guards, OPEN/CLOSED creation and empty/out-of-range pages.
- Verification fixes: browser test exposed Tab escaping the native dialog; explicit focus cycling fixes it. A failing unit test exposed case-sensitive request-ID extraction; case-insensitive header lookup fixes it. Both regression checks now pass.
- Final changes remain uncommitted on `feature/job-api-integration`, preserving preexisting uncommitted auth work. No merge, push or BE change performed.
- Final validation: `npm test`, `npm run lint`, `npm run build`, and `git diff --check` all exit 0. Node tests retain all auth regressions; browser QA exits 0 with 18 groups. Screenshots are at `/tmp/fitwork-job-qa`, and the repeatable browser script plus live-BE checklist are documented in README.
