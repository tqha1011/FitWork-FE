export type ProcessingStatus =
  "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export interface ResumeReference {
  publicId: string;
  ingestionPublicId: string;
  ingestionStatus: ProcessingStatus;
}
export interface ResumeIngestionState {
  resumePublicId: string;
  ingestionPublicId: string;
  status: ProcessingStatus;
  errorMessage?: string;
  updatedAt: string;
}
export interface EvaluationState {
  evaluationPublicId: string;
  status: ProcessingStatus;
  overallScore?: number;
  errorMessage?: string;
  updatedAt: string;
}
export interface CriterionResult {
  criterionId: string;
  criterionText: string;
  verdict: "MATCHED" | "PARTIAL" | "MISSING";
  scoreContribution: number;
  explanation: string;
  evidence: {
    snippet: string;
    section: "resume";
    startOffset: number;
    endOffset: number;
  }[];
}
export interface BreakdownV1 {
  schemaVersion: 1;
  skills: number;
  experience: number;
  education: number;
  overallFit: number;
}
export interface BreakdownV2 {
  schemaVersion: 2;
  criteria: { criterionId: string; scoreContribution: number }[];
}
export interface EvidenceV1 {
  schemaVersion: 1;
  strengths: string[];
  gaps: string[];
  explanation: string;
}
export interface EvidenceV2 extends Partial<Omit<EvidenceV1, "schemaVersion">> {
  schemaVersion: 2;
  criteria: CriterionResult[];
}
export interface EvaluationDetail {
  publicId: string;
  overallScore: number;
  scoreBreakdown: BreakdownV1 | BreakdownV2;
  evidence: EvidenceV1 | EvidenceV2;
}
export interface JobOwnerEvaluation extends EvaluationDetail {
  decisionSupportOnly: true;
  resumeRedaction: {
    redactedResumeText: string | null;
    redactedResumeVersion: string | null;
  };
  metadata: {
    jobContentHash: string;
    resumeContentHash: string;
    redactedResumeHash: string | null;
    parserVersion: string;
    redactionVersion: string | null;
    model: string;
    promptVersion: string;
  };
}
