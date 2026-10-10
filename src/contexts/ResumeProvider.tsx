import { registerSessionResume } from "../shared/resumeSession";
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
  useEffect(() => {
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
  }, [publicId, ingestionPublicId, revision, update]);
  return null;
}
export default function ResumeProvider({ children }: { children: ReactNode }) {
  const [resumes, setResumes] = useState<SessionResume[]>([]);
  const [evaluations, setEvaluations] = useState<
    Record<string, EvaluationReference>
  >({});
  const update = useCallback(
    (id: string, ingestionId: string, patch: Partial<SessionResume>) => {
      setResumes((items) =>
        items.map((item) =>
          item.publicId === id &&
          item.ingestionPublicId === ingestionId &&
          (!patch.state || acceptProcessingState(item, item.state, patch.state))
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
      setEvaluations((items) => ({
        ...items,
        [evaluationKey(jobId, resume.publicId)]: {
          publicId,
          ingestionPublicId: resume.ingestionPublicId,
        },
      }));
    },
    [],
  );
  return (
    <ResumeContext.Provider
      value={{
        resumes,
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
