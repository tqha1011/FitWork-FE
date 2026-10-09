import { CanceledError } from "axios";
import { api } from "./api.ts";
import {
  getAuthSession,
  getSessionGeneration,
  subscribeAuthSession,
} from "./authSession.ts";
import type {
  ApplicationStatus,
  ApplyJobRequest,
  CreateJobRequest,
  JobApplicationItem,
  JobFilters,
  JobItem,
  PageResult,
  ReferenceData,
  ReferenceItem,
  UpdateJobRequest,
} from "../types/job.ts";

let references: ReferenceData | undefined;
let referenceFlight: Promise<ReferenceData> | undefined;
let referenceController: AbortController | undefined;
let scope = sessionScope();
function sessionScope(): string {
  const user = getAuthSession()?.user;
  return `${getSessionGeneration()}:${user?.publicId ?? ""}:${user?.role ?? ""}`;
}
subscribeAuthSession(() => {
  const next = sessionScope();
  if (scope === next) return;
  scope = next;
  referenceController?.abort();
  referenceController = undefined;
  referenceFlight = undefined;
  references = undefined;
});
export function getReferences(): Promise<ReferenceData> {
  if (references) return Promise.resolve(references);
  if (referenceFlight) return referenceFlight;
  const controller = new AbortController();
  referenceController = controller;
  const flight = Promise.all([
    api.get<ReferenceItem[]>("/categories", { signal: controller.signal }),
    api.get<ReferenceItem[]>("/skills", { signal: controller.signal }),
    api.get<ReferenceItem[]>("/arrangements", { signal: controller.signal }),
  ])
    .then(([categories, skills, arrangements]) => {
      if (controller.signal.aborted) throw new CanceledError();
      references = {
        categories: categories.data,
        skills: skills.data,
        arrangements: arrangements.data,
      };
      return references;
    })
    .catch((error: unknown) => {
      controller.abort();
      throw error;
    })
    .finally(() => {
      if (referenceFlight === flight) {
        referenceFlight = undefined;
        referenceController = undefined;
      }
    });
  referenceFlight = flight;
  return flight;
}
export async function searchJobs(
  filters: JobFilters,
  signal?: AbortSignal,
): Promise<PageResult<JobItem>> {
  const params: Record<string, string | number> = {
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  };
  if (filters.title?.trim()) params.title = filters.title.trim();
  if (filters.categoryIds?.length)
    params.categoryIds = filters.categoryIds.join(",");
  if (filters.skillIds?.length) params.skillIds = filters.skillIds.join(",");
  if (filters.budgetMin !== undefined) params.budgetMin = filters.budgetMin;
  if (filters.budgetMax !== undefined) params.budgetMax = filters.budgetMax;
  return (await api.get<PageResult<JobItem>>("/job", { params, signal })).data;
}
export async function createJob(input: CreateJobRequest): Promise<void> {
  await api.post<void>("/job", input);
}
export async function updateJob(
  jobPublicId: string,
  input: UpdateJobRequest,
): Promise<void> {
  await api.patch<void>(`/job/${encodeURIComponent(jobPublicId)}`, input);
}
export async function applyToJob(
  jobPublicId: string,
  input: ApplyJobRequest,
): Promise<{ message: string }> {
  return (
    await api.post<{ message: string }>(
      `/job/${encodeURIComponent(jobPublicId)}/apply`,
      input,
    )
  ).data;
}
export async function updateApplicationStatus(
  jobApplicantPublicId: string,
  status: ApplicationStatus,
): Promise<{ message: string }> {
  return (
    await api.patch<{ message: string }>(
      `/job/applicants/${encodeURIComponent(jobApplicantPublicId)}/status`,
      { status },
    )
  ).data;
}
export async function getApplications(
  pageNumber = 1,
  pageSize = 20,
  signal?: AbortSignal,
): Promise<PageResult<JobApplicationItem>> {
  return (
    await api.get<PageResult<JobApplicationItem>>("/job/applied", {
      params: { pageNumber, pageSize },
      signal,
    })
  ).data;
}
export async function getAllApplications(
  signal?: AbortSignal,
): Promise<JobApplicationItem[]> {
  const items = new Map<string, JobApplicationItem>();
  let pageNumber = 1;
  while (true) {
    const page = await getApplications(pageNumber, 100, signal);
    if (
      page.pageNumber !== pageNumber ||
      !Number.isSafeInteger(page.totalPages) ||
      page.totalPages < 0 ||
      !Array.isArray(page.items)
    )
      throw new Error("Application history is incomplete. Please retry.");
    for (const item of page.items) items.set(item.jobPublicId, item);
    if (!page.hasNext && pageNumber >= page.totalPages) break;
    if (!page.items.length)
      throw new Error(
        "Application history changed while loading. Please retry.",
      );
    pageNumber++;
  }
  return [...items.values()];
}
