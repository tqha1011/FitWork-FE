import { createContext, useContext } from "react";
import type { JobApplicationItem, JobItem, ReferenceData } from "../types/job";
export interface JobContextValue {
  references?: ReferenceData;
  referenceError?: string;
  retryReferences: () => void;
  applications: JobApplicationItem[];
  historyState: "loading" | "ready" | "error";
  historyError?: string;
  refreshHistory: () => Promise<JobApplicationItem[]>;
  confirmedJobs: ReadonlySet<string>;
  confirmApplication: (jobPublicId: string) => void;
  knownJobs: ReadonlyMap<string, JobItem>;
  rememberJobs: (jobs: JobItem[]) => void;
  searchVersion: number;
  invalidateSearch: () => void;
}
export const JobContext = createContext<JobContextValue | null>(null);
export function useJobs(): JobContextValue {
  const context = useContext(JobContext);
  if (!context) throw new Error("JobProvider is missing");
  return context;
}
