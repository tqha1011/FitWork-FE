import type { SessionResume } from "../contexts/resumeContext.ts";
import type { ResumeReference } from "../types/evaluation.ts";
import type { ResumeItem } from "../types/resume.ts";
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

export function registerSavedResume(
  item: ResumeItem,
  previous?: SessionResume,
): SessionResume {
  const sameIngestion =
    !!previous && previous.ingestionPublicId === item.ingestionPublicId;
  // A fresh HTTP terminal status can advance an old socket snapshot. Keep a
  // live snapshot over a nonterminal HTTP result that may have started earlier.
  const state = sameIngestion ? previous.state : undefined;
  const previousStatus = sameIngestion ? previous.ingestionStatus : undefined;
  const httpTerminal =
    item.ingestionStatus === "COMPLETED" || item.ingestionStatus === "FAILED";
  const status = httpTerminal
    ? item.ingestionStatus
    : previousStatus === "COMPLETED" || previousStatus === "FAILED"
      ? previousStatus
      : state?.status === "PROCESSING"
        ? state.status
        : item.ingestionStatus;
  const httpAdvances =
    !!state &&
    state.status !== item.ingestionStatus &&
    (item.ingestionStatus === "COMPLETED" ||
      item.ingestionStatus === "FAILED" ||
      (state.status === "PENDING" && item.ingestionStatus === "PROCESSING"));
  return {
    publicId: item.publicId,
    name: item.fileName,
    contentType:
      item.fileType === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: item.fileSize,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    ingestionPublicId: item.ingestionPublicId,
    ingestionStatus: status,
    confirmedIngestionStatus: httpTerminal
      ? item.ingestionStatus
      : sameIngestion
        ? previous.confirmedIngestionStatus
        : undefined,
    storageKey: sameIngestion ? previous.storageKey : undefined,
    state: httpAdvances ? undefined : state,
    revision: sameIngestion ? previous.revision : (previous?.revision ?? 0) + 1,
    connection: sameIngestion ? previous.connection : "connecting",
  };
}
