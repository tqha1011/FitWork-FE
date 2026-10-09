import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isCancel } from "axios";
import { getAllApplications, getReferences } from "../services/jobService";
import { JobContext } from "./jobContext";
import { useAuth } from "./authContext";
import { jobErrorMessage } from "../shared/jobErrorMessage";
import type { JobApplicationItem, JobItem, ReferenceData } from "../types/job";

export default function JobProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [references, setReferences] = useState<ReferenceData>();
  const [referenceError, setReferenceError] = useState<string>();
  const [referenceVersion, setReferenceVersion] = useState(0);
  const [applications, setApplications] = useState<JobApplicationItem[]>([]);
  const [historyState, setHistoryState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [historyError, setHistoryError] = useState<string>();
  const [confirmedJobs, setConfirmedJobs] = useState<Set<string>>(new Set());
  const [knownJobs, setKnownJobs] = useState<Map<string, JobItem>>(new Map());
  const [searchVersion, setSearchVersion] = useState(0);
  const historyFlight = useRef<Promise<JobApplicationItem[]> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const active = useRef(false);
  const refreshHistory = useCallback((): Promise<JobApplicationItem[]> => {
    if (historyFlight.current) return historyFlight.current;
    setHistoryState("loading");
    setHistoryError(undefined);
    const abort = new AbortController();
    controller.current = abort;
    const flight = getAllApplications(abort.signal)
      .then((items) => {
        if (active.current && !abort.signal.aborted) {
          setApplications(items);
          setHistoryState("ready");
        }
        return items;
      })
      .catch((error: unknown) => {
        if (active.current && !abort.signal.aborted) {
          setHistoryState("error");
          setHistoryError(jobErrorMessage(error));
        }
        throw error;
      })
      .finally(() => {
        if (historyFlight.current === flight) historyFlight.current = null;
      });
    historyFlight.current = flight;
    return flight;
  }, []);
  useEffect(() => {
    let live = true;
    void getReferences()
      .then((data) => {
        if (live) {
          setReferences(data);
          setReferenceError(undefined);
        }
      })
      .catch((error) => {
        if (live && !isCancel(error)) setReferenceError(jobErrorMessage(error));
      });
    return () => {
      live = false;
    };
  }, [referenceVersion]);
  useEffect(() => {
    active.current = true;
    if (session?.user.role === "freelancer")
      void refreshHistory().catch(() => undefined);
    return () => {
      active.current = false;
      controller.current?.abort();
      historyFlight.current = null;
    };
  }, [refreshHistory, session?.user.role]);
  const rememberJobs = useCallback((jobs: JobItem[]) => {
    setKnownJobs((previous) => {
      const next = new Map(previous);
      jobs.forEach((job) => next.set(job.publicId, job));
      return next;
    });
  }, []);
  return (
    <JobContext.Provider
      value={{
        references,
        referenceError,
        retryReferences: () => {
          setReferenceError(undefined);
          setReferenceVersion((v) => v + 1);
        },
        applications,
        historyState,
        historyError,
        refreshHistory,
        confirmedJobs,
        confirmApplication: (id) =>
          setConfirmedJobs((prev) => new Set([...prev, id])),
        knownJobs,
        rememberJobs,
        searchVersion,
        invalidateSearch: () => setSearchVersion((v) => v + 1),
      }}
    >
      {children}
    </JobContext.Provider>
  );
}
