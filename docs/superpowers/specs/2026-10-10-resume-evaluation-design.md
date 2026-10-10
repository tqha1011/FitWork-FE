# Resume and applicant evaluation integration

## Outcome

Extend the existing FitWork workspace with resume management and applicant evaluation using the supplied backend contract. Preserve the existing English UI, workspace navigation, typography and theme. HTTP uses the existing authenticated API client; signed storage requests remain isolated from API credentials.

## Applicant experience

- Add My Resumes to freelancer navigation. Provide a named PDF/DOCX upload, progress, ingestion status, replacement, deletion, PDF preview and download. Validate nonempty names and supported MIME with integer size from 1 to 5,242,880 bytes. Replacement uploads to a new storage key before PATCH with both required fields. Retry ingestion uses the retained name and storage key.
- Maintain session-scoped resume references and display metadata shared with the existing application dialog. Explicitly label the collection as resumes available in this session because no server list exists. Application history can supply resume IDs but cannot supply missing ingestion references or metadata. Do not fabricate them or treat cached data as authoritative.
- Allow the application dialog to select an available resume or upload a new one. Apply remains a separate request; ingestion completion gates evaluation, not a fabricated application result.
- Add evaluation actions to successful application submission and application history when the correct resume's current ingestion reference is available. Retain evaluation IDs by job/resume in the authenticated workspace. Explain unavailable actions when the session lacks a reference.
- Show pending, processing, failed, connection uncertainty and completed states separately. FAILED offers explicit POST retry with the same job/resume. On completion fetch detail; also attempt detail after POST to support reused completed results. HTTP 409 alone never implies a running task.

## Realtime and state

Use socket.io-client and the backend origin derived independently from the API URL's /api prefix. Use /resume and /evaluation namespaces with default /socket.io path and raw access token in auth. Attach listeners before connecting; join responses are same-name server events, not acknowledgements.

Apply snapshot and notifications through the same state acceptance function. Check resume and ingestion IDs or evaluation ID, compare ISO timestamps by parsed time, and discard stale events. Rejoin after reconnect; reconnect on refreshed auth token. Clean up connections/listeners on unmount, deletion, reference replacement or session change. A timeout or disconnect reports uncertainty without changing backend processing status. Resume deletion leaves its room and removes the session entry after 204.

## Result rendering

Shared result component shows overall score including zero, strengths, gaps and explanation. Render each object's own schemaVersion. V1 breakdown uses named raw values without invented denominators. V2 matches breakdown and evidence by criterionId and displays criterion text, verdict, contribution, explanation and snippets. Explain that criteria reflect structured job skills and contributions are portions of the overall score.

Company detail is an authenticated client route carrying real job and evaluation public IDs and calls only the job-owner endpoint. Label results as decision support. Display nullable redacted text when supplied. Any offset highlighting must verify text.slice(startOffset, endOffset) matches the snippet. Never offer applicant CV download or applicant sockets for company views.

## Backend dependencies

Company applicant discovery remains unavailable until backend provides an applicant list and evaluation IDs. Add a clear empty/dependency state rather than invented candidates. Resume lists/metadata, HTTP task status, evaluation lookup/list and durable cross-device reference recovery remain backend dependencies. Company 409 exposes no task status; provide manual refresh rather than indefinite polling.

## Errors and verification

Use existing refresh/login behavior for 401 and API error messages for other failures. Preserve forms on validation failure. Do not automatically retry createResume after uncertain network/500 outcomes because a record may already exist. Keep upload and registration stages distinct. DELETE has no JSON body to parse.

Cover new HTTP routes/payloads, uncredentialed storage, event acceptance and stale/foreign notifications, zero scores, mixed V1/V2 rendering data and retry transitions with meaningful tests where the repository runner supports them. Run npm test, npm run lint and npm run build. Verify responsive layouts, upload and failure states, reconnect and cleanup, and document live backend checks that cannot be performed locally.
