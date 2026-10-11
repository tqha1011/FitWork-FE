import type { ProcessingStatus } from "./evaluation.ts";
export interface ResumeItem {
  publicId: string;
  fileName: string;
  fileType: "pdf" | "docx";
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  ingestionPublicId: string | null;
  ingestionStatus: ProcessingStatus | null;
}
