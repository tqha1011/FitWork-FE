import { createContext, useContext } from "react";
import type {
  AccountSettings,
  AiState,
  Application,
  ApplicationStatus,
  ClientProfile,
  FreelancerProfile,
  Job,
  JobStatus,
  Notification,
  PreviewState,
  Role,
} from "../types/marketplace";
export interface MarketplaceState {
  role: Role;
  clientId: string;
  freelancerId: string;
  jobs: Job[];
  applications: Application[];
  clients: ClientProfile[];
  freelancers: FreelancerProfile[];
  savedIds: string[];
  notifications: Notification[];
  settings: AccountSettings;
}
export interface MarketplaceContextValue extends MarketplaceState {
  previewState: PreviewState;
  setPreviewState: (state: PreviewState) => void;
  aiState: AiState;
  setAiState: (state: AiState) => void;
  setRole: (role: Role, clientId?: string) => void;
  toggleSave: (id: string) => void;
  submitApplication: (
    application: Omit<
      Application,
      "id" | "submittedAt" | "status" | "freelancerId" | "match"
    >,
  ) => string;
  withdrawApplication: (id: string) => void;
  decideApplication: (
    id: string,
    status: Extract<ApplicationStatus, "Shortlisted" | "Accepted" | "Rejected">,
  ) => void;
  saveJob: (job: Job) => void;
  setJobStatus: (id: string, status: JobStatus) => void;
  updateFreelancer: (profile: FreelancerProfile) => void;
  updateClient: (profile: ClientProfile) => void;
  markRead: (id?: string) => void;
  updateSettings: (settings: AccountSettings) => void;
  resetDemo: () => void;
}
export const MarketplaceContext = createContext<MarketplaceContextValue | null>(
  null,
);
export function useMarketplace(): MarketplaceContextValue {
  const value = useContext(MarketplaceContext);
  if (!value) throw new Error("MarketplaceProvider is missing");
  return value;
}
