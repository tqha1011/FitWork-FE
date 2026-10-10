import type {
  ApplyJobRequest,
  CreateJobRequest,
  JobFilters,
} from "../types/job.ts";
export type FieldErrors = Record<string, string>;
export interface JobFormValues {
  title: string;
  description: string;
  requirements: string;
  location: string;
  budget: string;
  currency: string;
  status: string;
  categoryId: string;
  arrangementId: string;
  skillsId: string[];
  dueAt: string;
}
const nonnegative = (value: string): boolean =>
  value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;
const integer = (value: string): boolean =>
  value.trim() !== "" && Number.isSafeInteger(Number(value));
export function isJobExpired(dueAt: string, now = Date.now()): boolean {
  const deadline = Date.parse(dueAt);
  return !Number.isFinite(deadline) || deadline <= now;
}
export function validateJobForm(
  form: JobFormValues,
  now = Date.now(),
): { errors: FieldErrors; payload?: CreateJobRequest } {
  const errors: FieldErrors = {};
  for (const key of [
    "title",
    "description",
    "requirements",
    "location",
  ] as const)
    if (!form[key].trim()) errors[key] = "Enter this required information.";
  if (!nonnegative(form.budget))
    errors.budget = "Enter a finite amount of 0 or more.";
  for (const key of ["categoryId", "arrangementId"] as const)
    if (!integer(form[key])) errors[key] = "Choose a valid option.";
  if (form.skillsId.some((id) => !integer(id)))
    errors.skillsId = "Choose valid skills.";
  if (isJobExpired(form.dueAt, now))
    errors.dueAt = "Choose a future deadline in your local time.";
  if (!["OPEN", "CLOSED"].includes(form.status))
    errors.status = "Choose a job status.";
  if (!["VND", "USD"].includes(form.currency))
    errors.currency = "Choose a currency.";
  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    payload: {
      title: form.title.trim(),
      description: form.description.trim(),
      requirements: form.requirements.trim(),
      location: form.location.trim(),
      budget: Number(form.budget),
      categoryId: Number(form.categoryId),
      arrangementId: Number(form.arrangementId),
      skillsId: form.skillsId.map(Number),
      currency: form.currency as CreateJobRequest["currency"],
      status: form.status as CreateJobRequest["status"],
      dueAt: new Date(form.dueAt).toISOString(),
    },
  };
}
export function validateApplication(form: {
  coverLetter: string;
  proposedRate: string;
  estimatedDay: string;
}): { errors: FieldErrors; payload?: Omit<ApplyJobRequest, "resumePublicId"> } {
  const errors: FieldErrors = {};
  if (!form.coverLetter.trim()) errors.coverLetter = "Enter a cover letter.";
  if (!nonnegative(form.proposedRate))
    errors.proposedRate = "Enter a finite amount of 0 or more.";
  if (!integer(form.estimatedDay) || Number(form.estimatedDay) < 1)
    errors.estimatedDay = "Enter a whole number of at least 1 day.";
  return Object.keys(errors).length
    ? { errors }
    : {
        errors,
        payload: {
          coverLetter: form.coverLetter.trim(),
          proposedRate: Number(form.proposedRate),
          estimatedDay: Number(form.estimatedDay),
        },
      };
}
export function resumeContentType(file: {
  name: string;
  size: number;
  type: string;
}): string {
  const types: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  const mime = types[file.name.split(".").at(-1)?.toLowerCase() ?? ""];
  if (
    !mime ||
    !Number.isSafeInteger(file.size) ||
    file.size < 1 ||
    file.size > 5 * 1024 * 1024 ||
    (file.type && file.type !== mime)
  )
    throw new Error("Choose a PDF or DOCX file between 1 byte and 5 MiB.");
  return mime;
}
export function parseJobFilters(params: URLSearchParams): {
  filters: JobFilters;
  error?: string;
} {
  const page = (key: string, fallback: number) =>
    integer(params.get(key) ?? "") && Number(params.get(key)) >= 1
      ? Number(params.get(key))
      : fallback;
  const filters: JobFilters = {
    pageNumber: page("pageNumber", 1),
    pageSize: page("pageSize", 20),
  };
  let error: string | undefined;
  if (params.get("title")?.trim()) filters.title = params.get("title")!.trim();
  for (const key of ["categoryIds", "skillIds"] as const) {
    const raw = params.get(key);
    if (!raw) continue;
    const ids = raw.split(",");
    if (ids.some((id) => !integer(id)))
      error = "Category and skill filters must contain valid IDs.";
    else filters[key] = [...new Set(ids.map(Number))];
  }
  for (const key of ["budgetMin", "budgetMax"] as const) {
    const raw = params.get(key);
    if (!raw) continue;
    if (!nonnegative(raw))
      error = "Enter finite budget amounts of 0 or more (VND).";
    else filters[key] = Number(raw);
  }
  if (
    filters.budgetMin !== undefined &&
    filters.budgetMax !== undefined &&
    filters.budgetMin > filters.budgetMax
  )
    error = "Maximum budget must be at least the minimum budget (VND).";
  return { filters, error };
}
export function serializeJobFilters(filters: JobFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.pageNumber !== 1)
    params.set("pageNumber", String(filters.pageNumber));
  if (filters.pageSize !== 20) params.set("pageSize", String(filters.pageSize));
  if (filters.title?.trim()) params.set("title", filters.title.trim());
  for (const key of ["categoryIds", "skillIds"] as const)
    if (filters[key]?.length) params.set(key, filters[key]!.join(","));
  for (const key of ["budgetMin", "budgetMax"] as const)
    if (filters[key] !== undefined) params.set(key, String(filters[key]));
  return params;
}
