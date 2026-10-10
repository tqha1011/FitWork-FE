import type { SessionResume } from "../contexts/resumeContext.ts";
import type { ResumeReference } from "../types/evaluation.ts";
export function registerSessionResume(
  reference: ResumeReference,
  metadata: Pick<SessionResume, "name" | "storageKey" | "contentType" | "size">,
  previousRevision = 0,
): SessionResume {
  // Copy display metadata explicitly; retained session records also carry old
  // ingestion references and worker state which must never overwrite a PATCH.
  const { name, storageKey, contentType, size } = metadata;
  return {
    ...reference,
    name,
    storageKey,
    contentType,
    size,
    revision: previousRevision + 1,
    connection: "connecting",
  };
}
