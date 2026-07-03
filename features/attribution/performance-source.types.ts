import type {
  PerformanceSourcePlatform,
  PerformanceSourceStatus
} from "@prisma/client";

export type PerformanceSourceSourceType = "url" | "file" | "text" | "url_file" | "url_text";

export type SerializedPerformanceSource = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  uploadedBy: string;
  platform: PerformanceSourcePlatform;
  sourceType: string;
  url: string | null;
  status: PerformanceSourceStatus;
  fileKey: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  metricsJson: Record<string, unknown> | null;
  analysisJson: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  analyzedAt: string | null;
};
