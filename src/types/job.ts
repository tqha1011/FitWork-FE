export interface ReferenceItem {
  id: number;
  name: string;
}
export interface ReferenceData {
  categories: ReferenceItem[];
  skills: ReferenceItem[];
  arrangements: ReferenceItem[];
}
export type Currency = "VND" | "USD";
export type JobStatus = "OPEN" | "CLOSED";
export type ApplicationStatus =
  "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";
export interface PageResult<T> {
  items: T[];
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
export interface JobItem {
  publicId: string;
  title: string;
  description: string;
  location: string;
  budget: number;
  currency: Currency;
  skills: ReferenceItem[];
  category: ReferenceItem;
  arrangement: ReferenceItem;
  dueAt: string;
  totalApplicants: number;
}
export interface JobApplicationItem {
  jobApplicantPublicId: string;
  jobPublicId: string;
  resumePublicId: string;
  status: ApplicationStatus;
  proposedRate: number;
  estimatedDays: number;
  appliedAt: string;
  matchingScore: number;
}
export interface JobFilters {
  pageNumber: number;
  pageSize: number;
  title?: string;
  categoryIds?: number[];
  skillIds?: number[];
  budgetMin?: number;
  budgetMax?: number;
}
export interface CreateJobRequest {
  title: string;
  description: string;
  requirements: string;
  location: string;
  budget: number;
  currency: Currency;
  status: JobStatus;
  categoryId: number;
  arrangementId: number;
  skillsId: number[];
  dueAt: string;
}
export type UpdateJobRequest = Partial<
  Pick<
    CreateJobRequest,
    | "title"
    | "description"
    | "requirements"
    | "location"
    | "status"
    | "dueAt"
    | "budget"
  >
>;
export interface ApplyJobRequest {
  proposedRate: number;
  estimatedDay: number;
  coverLetter: string;
  resumePublicId: string;
}
export interface ResumeUploadResponse {
  uploadUrl: string;
  storageKey: string;
  expiresAt: string;
}
export interface ResumeResponse {
  publicId: string;
  ingestionPublicId: string;
  ingestionStatus: string;
}
