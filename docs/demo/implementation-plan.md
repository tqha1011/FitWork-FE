# FitWork Demo implementation

Use the backend contract in `FitworkBE-Nestjs/docs/demo/frontend-handoff.md` on `feat/monitoring-evaluation`.

1. Extend in-memory auth with validated demo claims, workspace expiry and generation cancellation. Serialize refresh, role switches and auth cookie mutations. Send logout bearer before clearing auth.
2. Add demo session API and explicit evaluation selection without changing latest-result callers or V1/V2 rendering.
3. Add `/demo` and sign-in entry. Restore once through existing refresh; start COMPANY on first visit. Retain a browser marker so expired reloads require an explicit new-session click.
4. Render role/countdown/server AI quota; recruiter applications, CV preview, sample/live evaluation selection and decisions; applicant CVs, job applications, live AI and existing upload flow.
5. Refresh session after mutations; applicant evaluation sockets plus HTTP reconciliation. Remount providers on generation change and ignore stale requests/results.
6. Verify auth races, explicit samples, expiry, quota/configuration failures and the browser acceptance journey. Run the full tests, lint and production build. Real S3/Gemini verification depends on the dedicated backend stack/bucket configuration.

Visual direction: retain FitWork theme tokens and typography. Use responsive cards, visible status/source labels, keyboard-accessible dialogs and separate sample controls during live processing/failure.
