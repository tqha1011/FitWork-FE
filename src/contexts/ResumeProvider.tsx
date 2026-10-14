import {
  registerSavedResume,
  registerSessionResume,
} from "../shared/resumeSession";
import { acceptProcessingState } from "../shared/processingState";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ResumeContext,
  evaluationKey,
  type SessionResume,
  type EvaluationReference,
} from "./resumeContext";
import type {
  ResumeIngestionState,
  ResumeReference,
} from "../types/evaluation";
import type { ResumeItem } from "../types/resume";
import {
  watchProcessing,
  type ConnectionState,
} from "../services/processingSocket";

function ResumeMonitor({
  resume,
  update,
}: {
  resume: SessionResume;
  update: (
    id: string,
    ingestionId: string,
    patch: Partial<SessionResume>,
  ) => void;
}) {
  const { publicId, ingestionPublicId, revision } = resume;
  const hasIngestion = !!ingestionPublicId && !!resume.ingestionStatus;
  useEffect(() => {
    if (!ingestionPublicId || !hasIngestion) return;
    const reference = { publicId, ingestionPublicId };
    return watchProcessing(
      "resume",
      reference,
      (value) => {
        const state = value as ResumeIngestionState;
        update(publicId, ingestionPublicId, {
          state,
          ingestionStatus: state.status,
        });
      },
      (connection: ConnectionState) =>
        update(publicId, ingestionPublicId, { connection }),
    );
  }, [publicId, ingestionPublicId, revision, update, hasIngestion]);
  return null;
}
export default function ResumeProvider({ children }: { children: ReactNode }) {
  const [resumes, setResumes] = useState<SessionResume[]>([]);
  const [evaluations, setEvaluations] = useState<
    Record<string, EvaluationReference>
  >({});
  const rememberSavedResumes = useCallback((saved: ResumeItem[]) => {
    setResumes((items) => {
      const next = new Map(items.map((item) => [item.publicId, item]));
      for (const item of saved)
        next.set(
          item.publicId,
          registerSavedResume(item, next.get(item.publicId)),
        );
      return [...next.values()];
    });
  }, []);
  const update = useCallback(
    (id: string, ingestionId: string, patch: Partial<SessionResume>) => {
      setResumes((items) =>
        items.map((item) =>
          item.publicId === id &&
          item.ingestionPublicId === ingestionId &&
          // HTTP confirms the terminal outcome for this ingestion. A delayed
          // socket snapshot cannot replace it, even with another terminal state.
          (!patch.state ||
            !["COMPLETED", "FAILED"].includes(
              item.confirmedIngestionStatus ?? "",
            ) ||
            patch.state.status === item.confirmedIngestionStatus) &&
          // A late join snapshot must not undo completion confirmed by HTTP.
          (!patch.state ||
            !["COMPLETED", "FAILED"].includes(item.ingestionStatus ?? "") ||
            !["PENDING", "PROCESSING"].includes(patch.state.status)) &&
          (!patch.state ||
            acceptProcessingState(
              { publicId: item.publicId, ingestionPublicId: ingestionId },
              item.state,
              patch.state,
            ))
            ? { ...item, ...patch }
            : item,
        ),
      );
    },
    [],
  );
  const rememberResume = useCallback(
    (
      reference: ResumeReference,
      metadata: {
        name: string;
        storageKey: string;
        contentType: string;
        size: number;
      },
    ) => {
      setResumes((items) => {
        const previous = items.find(
          (item) => item.publicId === reference.publicId,
        );
        const next = registerSessionResume(
          reference,
          metadata,
          previous?.revision,
        );
        return previous
          ? items.map((item) => (item.publicId === next.publicId ? next : item))
          : [...items, next];
      });
    },
    [],
  );
  const forgetResume = useCallback((id: string) => {
    setResumes((items) => items.filter((item) => item.publicId !== id));
  }, []);
  const reconnectResume = useCallback((id: string) => {
    setResumes((items) =>
      items.map((item) =>
        item.publicId === id
          ? { ...item, revision: item.revision + 1, connection: "connecting" }
          : item,
      ),
    );
  }, []);
  const rememberEvaluation = useCallback(
    (jobId: string, resume: SessionResume, publicId: string) => {
      if (!resume.ingestionPublicId) return;
      const ingestionPublicId = resume.ingestionPublicId;
      setEvaluations((items) => ({
        ...items,
        [evaluationKey(jobId, resume.publicId)]: {
          publicId,
          ingestionPublicId,
        },
      }));
    },
    [],
  );
  return (
    <ResumeContext.Provider
      value={{
        resumes,
        rememberSavedResumes,
        rememberResume,
        forgetResume,
        reconnectResume,
        evaluations,
        rememberEvaluation,
      }}
    >
      {resumes.map((resume) => (
        <ResumeMonitor key={resume.publicId} resume={resume} update={update} />
      ))}
      {children}
    </ResumeContext.Provider>
  );
}
