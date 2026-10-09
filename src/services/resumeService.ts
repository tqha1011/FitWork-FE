import axios from "axios";
import { api } from "./api.ts";
import { resumeContentType } from "../shared/jobValidation.ts";
import type { ResumeResponse, ResumeUploadResponse } from "../types/job.ts";

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
