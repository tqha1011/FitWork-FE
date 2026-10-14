import type { UserType } from "./auth";
import type { ProcessingStatus } from "./evaluation";
import type { ApplicationStatus } from "./job";

export interface DemoEvaluation {
  publicId: string;
  source: "SAMPLE" | "LIVE";
  status: ProcessingStatus;
  overallScore: number | null;
}
export interface DemoApplication {
  publicId: string;
  jobPublicId: string;
  resumePublicId: string;
  applicantName: string;
  isPrimaryApplicant: boolean;
  status: ApplicationStatus;
  sampleEvaluationPublicId: string | null;
  latestEvaluationPublicId: string | null;
  evaluations: DemoEvaluation[];
}
export interface DemoSession {
  id: string;
  expiresAt: string;
  userType: UserType;
  generation: number;
  ai: {
    used: number;
    limit: number;
    remaining: number;
    available: boolean;
    unavailableReason: string | null;
  };
  uploads: {
    used: number;
    limit: number;
    remaining: number;
    maxFileBytes: number;
  };
  jobs: { publicId: string; title: string; isFeatured: boolean }[];
  resumes: {
    publicId: string;
    fileName: string;
    isPrimaryApplicant: boolean;
  }[];
  applications: DemoApplication[];
}
