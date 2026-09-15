import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "react-toastify";
import * as seed from "../data/mockData";
import { MarketplaceContext } from "./marketplaceContext";
import type {
  MarketplaceContextValue,
  MarketplaceState,
} from "./marketplaceContext";
import type { AiState, PreviewState } from "../types/marketplace";

const initialState: MarketplaceState = {
  role: "guest",
  clientId: "c1",
  freelancerId: "f1",
  jobs: seed.jobs,
  applications: seed.applications,
  clients: seed.clients,
  freelancers: seed.freelancers,
  savedIds: ["j1", "j3"],
  notifications: seed.notifications,
  settings: {
    email: true,
    applicationUpdates: true,
    jobRecommendations: false,
    profilePublic: true,
  },
};
function readState(): MarketplaceState {
  try {
    const raw = sessionStorage.getItem("fitwork-demo-v1");
    if (raw) {
      const value = JSON.parse(raw) as MarketplaceState;
      if (
        Array.isArray(value.jobs) &&
        Array.isArray(value.applications) &&
        Array.isArray(value.freelancers) &&
        value.settings
      )
        return { ...initialState, ...value };
    }
  } catch {
    /* A fresh demo remains available when storage is disabled. */
  }
  return structuredClone(initialState);
}
const pendingStatuses = ["Submitted", "Reviewing", "Shortlisted"];
export default function MarketplaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<MarketplaceState>(readState);
  const [previewState, setPreviewState] = useState<PreviewState>("populated");
  const [aiState, setAiState] = useState<AiState>("ready");
  useEffect(() => {
    try {
      sessionStorage.setItem("fitwork-demo-v1", JSON.stringify(state));
    } catch {
      /* Session storage is optional. */
    }
  }, [state]);
  const value: MarketplaceContextValue = {
    ...state,
    previewState,
    setPreviewState,
    aiState,
    setAiState,
    setRole: (role, clientId = "c1") => {
      setState((s) => ({ ...s, role, clientId }));
      setPreviewState("populated");
    },
    toggleSave: (id) => {
      if (state.role !== "freelancer") return;
      setState((s) => ({
        ...s,
        savedIds: s.savedIds.includes(id)
          ? s.savedIds.filter((x) => x !== id)
          : [...s.savedIds, id],
      }));
      toast.success(
        state.savedIds.includes(id)
          ? "Job removed from saved Jobs"
          : "Job saved for later",
      );
    },
    submitApplication: (input) => {
      const job = state.jobs.find((j) => j.id === input.jobId);
      if (
        state.role !== "freelancer" ||
        !job ||
        job.status !== "Open" ||
        new Date(job.deadline) < new Date(seed.demoDate) ||
        state.applications.some(
          (a) =>
            a.jobId === input.jobId && a.freelancerId === state.freelancerId,
        )
      )
        throw new Error("This Job is no longer available for an application.");
      const id = crypto.randomUUID();
      setState((s) => ({
        ...s,
        applications: [
          {
            ...input,
            id,
            freelancerId: s.freelancerId,
            status: "Submitted",
            submittedAt: seed.demoDate,
            match: job.match,
          },
          ...s.applications,
        ],
      }));
      toast.success("Application submitted. You're all set!");
      return id;
    },
    withdrawApplication: (id) => {
      setState((s) => ({
        ...s,
        applications: s.applications.map((a) =>
          a.id === id &&
          s.role === "freelancer" &&
          a.freelancerId === s.freelancerId &&
          pendingStatuses.includes(a.status)
            ? { ...a, status: "Withdrawn" }
            : a,
        ),
      }));
      toast.success("Application withdrawn");
    },
    decideApplication: (id, status) => {
      setState((s) => {
        const application = s.applications.find((a) => a.id === id);
        const job = s.jobs.find((j) => j.id === application?.jobId);
        if (
          !application ||
          !job ||
          s.role !== "client" ||
          job.clientId !== s.clientId ||
          !["Open", "Reviewing"].includes(job.status) ||
          !pendingStatuses.includes(application.status)
        )
          return s;
        return {
          ...s,
          jobs: s.jobs.map((j) =>
            j.id === job.id && status === "Accepted"
              ? { ...j, status: "Filled" }
              : j,
          ),
          applications: s.applications.map((a) =>
            a.id === id
              ? { ...a, status }
              : status === "Accepted" &&
                  a.jobId === job.id &&
                  pendingStatuses.includes(a.status)
                ? { ...a, status: "Rejected" }
                : a,
          ),
        };
      });
      toast.success(
        status === "Accepted"
          ? "Freelancer accepted. This Job is now filled."
          : `Application ${status.toLowerCase()}`,
      );
    },
    saveJob: (job) => {
      if (state.role !== "client" || job.clientId !== state.clientId)
        throw new Error("Only the owning Client can save this Job.");
      setState((s) => ({
        ...s,
        jobs: s.jobs.some((j) => j.id === job.id)
          ? s.jobs.map((j) => (j.id === job.id ? job : j))
          : [job, ...s.jobs],
      }));
      toast.success(job.status === "Draft" ? "Draft saved" : "Job published");
    },
    setJobStatus: (id, status) => {
      setState((s) => ({
        ...s,
        jobs: s.jobs.map((j) =>
          j.id === id && s.role === "client" && j.clientId === s.clientId
            ? { ...j, status }
            : j,
        ),
      }));
      toast.success(`Job ${status.toLowerCase()}`);
    },
    updateFreelancer: (profile) => {
      if (state.role !== "freelancer" || profile.id !== state.freelancerId)
        return;
      setState((s) => ({
        ...s,
        freelancers: s.freelancers.map((p) =>
          p.id === profile.id ? profile : p,
        ),
      }));
      toast.success("Profile saved");
    },
    updateClient: (profile) => {
      if (state.role !== "client" || profile.id !== state.clientId) return;
      setState((s) => ({
        ...s,
        clients: s.clients.map((p) => (p.id === profile.id ? profile : p)),
      }));
      toast.success("Profile saved");
    },
    markRead: (id) =>
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) =>
          n.role === s.role && (!id || n.id === id) ? { ...n, read: true } : n,
        ),
      })),
    updateSettings: (settings) => {
      setState((s) => ({ ...s, settings }));
      toast.success("Preferences saved");
    },
    resetDemo: () => {
      setState(structuredClone(initialState));
      setPreviewState("populated");
      setAiState("ready");
      toast.info("Demo reset");
    },
  };
  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
}
