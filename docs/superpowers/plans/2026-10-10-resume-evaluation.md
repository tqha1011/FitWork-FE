# Resume and evaluation implementation plan

**Goal:** Implement the approved resume and evaluation integration in the existing workspace.
**Architecture:** Typed HTTP services, session-scoped context, dedicated Socket.IO watchers, and shared result UI. Existing authenticated axios and isolated storage transports remain in use.
**Tech stack:** React 19, TypeScript, Vite, Socket.IO client, node:test.
**Spec:** ../specs/2026-10-10-resume-evaluation-design.md

## Constraints and review focus

No fabricated backend routes or IDs; English UI and existing theme. Treat network uncertainty separately from worker failure. Preserve zero scores, reject stale/foreign events, rejoin after auth refresh, prevent duplicate registration after uncertain errors, and keep company requests isolated from applicant realtime/download permissions.

## Tasks

- [x] Add typed resume/evaluation contracts and HTTP mutations. Extend adapter tests for exact PATCH payload, empty DELETE, inline URLs, applicant/company evaluation routes.
- [x] Add tested event acceptance and Socket.IO watchers. Test different ingestion IDs, chronological timestamp ordering, zero scores, join snapshots, disconnect and refreshed tokens. Provide connection uncertainty after 20 seconds without confirmed state.
- [x] Add authenticated session context for resume references and evaluation IDs; mount under the session-keyed workspace and clean watchers on mutation/unmount.
- [x] Add resume upload/replace/retry/delete/download/preview UI with retained form values, upload progress and explicit session collection scope.
- [x] Connect existing application dialog and application history to shared resumes and evaluation controls. Apply first; evaluate only with current completed ingestion.
- [x] Render applicant and job-owner V1/V2 results, criterion IDs, snippets and nullable redacted text. Add company dependency page with no fabricated applicants.
- [x] Run npm test, npm run lint, npm run build; inspect UI at desktop/mobile and document live backend checks and unavailable backend sources.

## Execution decisions

User authorized direct implementation. Execute inline without another approval handoff. Existing checkout holds the prior job integration required by this feature; develop is unavailable locally and remotely, so keep changes on the current feature branch rather than creating an unrelated branch from main. No commit, push or merge requested.

## Progress

Baseline: npm test passed, 28 tests. Existing API base URL already includes /api.

Final verification: 36 unit tests pass, lint and production build pass. New browser smoke passes 12 groups; existing job browser regression passes 18 groups. Desktop/mobile screenshots inspected. Live backend storage/worker/LLM checks require real credentials and data and remain documented in docs/resume-evaluation-integration.md.

Review: no subagent review tool was available; reviewed routes, session isolation, realtime lifecycle, mutation uncertainty, schema rendering and application/resume ownership inline. Fixed stale PATCH metadata precedence and ensured evaluation uses the confirmed application's resume rather than a locally selected alternative.
