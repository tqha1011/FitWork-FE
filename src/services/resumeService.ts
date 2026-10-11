import axios from "axios";
import { api } from "./api.ts";
import { resumeContentType } from "../shared/jobValidation.ts";
import type {
  PageResult,
  ResumeResponse,
  ResumeUploadResponse,
} from "../types/job.ts";
import type { ResumeItem } from "../types/resume.ts";

export async function getResumes(
  pageNumber = 1,
  pageSize = 20,
  signal?: AbortSignal,
): Promise<PageResult<ResumeItem>> {
  return (
    await api.get<PageResult<ResumeItem>>("/resume", {
      params: { pageNumber, pageSize },
      signal,
    })
  ).data;
}
export async function getResume(
  resumePublicId: string,
  signal?: AbortSignal,
): Promise<ResumeItem> {
  return (
    await api.get<ResumeItem>(`/resume/${encodeURIComponent(resumePublicId)}`, {
      signal,
    })
  ).data;
}

// A separate transport keeps API interceptors, JWT and credentialed cookies
// off signed storage requests. Never attach API headers to this client.
export const storageClient = axios.create({
  withCredentials: false,
  timeout: 60000,
});
export async function requestResumeUpload(
  file: File,
  signal?: AbortSignal,
): Promise<ResumeUploadResponse> {
  const contentType = resumeContentType(file);
  return (
    await api.post<ResumeUploadResponse>(
      "/resume/upload-url",
      { fileName: file.name, contentType, fileSize: file.size },
      { signal },
    )
  ).data;
}
export async function uploadResumeFile(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  await storageClient.put(uploadUrl, file, {
    signal,
    withCredentials: false,
    headers: { "Content-Type": resumeContentType(file) },
    onUploadProgress: (event) => {
      if (event.total)
        onProgress?.(Math.round((event.loaded / event.total) * 100));
    },
  });
}
export async function createResume(
  name: string,
  storageKey: string,
  signal?: AbortSignal,
): Promise<ResumeResponse> {
  return (
    await api.post<ResumeResponse>("/resume", { name, storageKey }, { signal })
  ).data;
}

export async function updateResume(
  resumePublicId: string,
  name: string,
  storageKey: string,
  signal?: AbortSignal,
): Promise<ResumeResponse> {
  return (
    await api.patch<ResumeResponse>(
      `/resume/${encodeURIComponent(resumePublicId)}`,
      { name: name.trim(), storageKey },
      { signal },
    )
  ).data;
}
export async function deleteResume(resumePublicId: string): Promise<void> {
  await api.delete(`/resume/${encodeURIComponent(resumePublicId)}`);
}
export async function getResumeDownloadUrl(
  resumePublicId: string,
  disposition: "inline" | "attachment" = "attachment",
): Promise<string> {
  return (
    await api.get<{ downloadUrl: string }>(
      `/resume/${encodeURIComponent(resumePublicId)}/download-url`,
      { params: { disposition } },
    )
  ).data.downloadUrl;
}
