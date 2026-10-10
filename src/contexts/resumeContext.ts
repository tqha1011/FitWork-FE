import { createContext, useContext } from "react";
import type {
  ResumeIngestionState,
  ResumeReference,
} from "../types/evaluation";
import type { ConnectionState } from "../services/processingSocket";
export interface SessionResume extends ResumeReference {
  name: string;
  storageKey: string;
  contentType: string;
  size: number;
  revision: number;
  state?: ResumeIngestionState;
  connection: ConnectionState;
}
export interface EvaluationReference {
  publicId: string;
  ingestionPublicId: string;
}
export interface ResumeContextValue {
  resumes: SessionResume[];
  rememberResume: (
    reference: ResumeReference,
    metadata: {
      name: string;
      storageKey: string;
      contentType: string;
      size: number;
    },
  ) => void;
  forgetResume: (id: string) => void;
  reconnectResume: (id: string) => void;
  evaluations: Record<string, EvaluationReference>;
  rememberEvaluation: (
    jobId: string,
    resume: SessionResume,
    evaluationId: string,
  ) => void;
}
export const ResumeContext = createContext<ResumeContextValue | null>(null);
export function useResumes(): ResumeContextValue {
  const context = useContext(ResumeContext);
  if (!context) throw new Error("ResumeProvider is missing");
  return context;
}
export const evaluationKey = (jobId: string, resumeId: string) =>
  `${jobId}:${resumeId}`;
