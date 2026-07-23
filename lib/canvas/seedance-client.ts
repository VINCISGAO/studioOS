import "server-only";
import {
  readSeedanceApiKey,
  readSeedanceCallbackUrl,
  SEEDANCE_API_BASE_URL
} from "@/lib/core/config/seedance-key";
import { normalizeSeedanceModelId } from "@/lib/canvas/seedance-credits-pricing";
import { logger } from "@/lib/core/logger";

export type SeedanceApiModelId = "seedance-2-0" | "seedance-2-0-fast" | "seedance-2-0-mini";

export type SeedanceGenerationType = "text-to-video" | "image-to-video" | "reference-to-video";

export type SeedanceTaskStatus = "queued" | "generating" | "completed" | "failed";

export type SeedanceBillingStatus = "reserved" | "charged" | "refunded" | "refund_failed";

export type SeedanceVideoInput = {
  prompt: string;
  generation_type?: SeedanceGenerationType;
  image_urls?: string[];
  video_urls?: string[];
  audio_urls?: string[];
  duration?: number;
  aspect_ratio?: string;
  resolution?: string;
  generate_audio?: boolean;
  watermark?: boolean;
  web_search?: boolean;
  return_last_frame?: boolean;
  seed?: number;
};

export type SeedanceCreateTaskResponse = {
  taskId: string;
  credits: number;
};

export type SeedanceTask = {
  id: string;
  status: SeedanceTaskStatus;
  created_at?: number;
  model?: string;
  billing_status?: SeedanceBillingStatus;
  credits?: number;
  failed_reason?: string | null;
  data?: {
    results?: string[];
    video_expires_at?: string | null;
    last_frame_url?: string | null;
    processing_time?: number | null;
    failed_reason?: string | null;
    credits_refunded?: number | null;
  };
};

type SeedanceErrorBody = {
  error?: {
    code?: string;
    message?: string;
    required?: number;
    available?: number;
    retry_after?: number;
  };
};

export class SeedanceApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly required?: number;
  readonly available?: number;
  readonly retryAfter?: number;

  constructor(input: {
    status: number;
    message: string;
    code?: string;
    required?: number;
    available?: number;
    retryAfter?: number;
  }) {
    super(input.message);
    this.name = "SeedanceApiError";
    this.status = input.status;
    this.code = input.code ?? "SEEDANCE_API_ERROR";
    this.required = input.required;
    this.available = input.available;
    this.retryAfter = input.retryAfter;
  }
}

function resolveApiKey() {
  const key = readSeedanceApiKey();
  if (!key) {
    throw new SeedanceApiError({
      status: 500,
      code: "SEEDANCE_NOT_CONFIGURED",
      message: "SEEDANCE_API_KEY is not configured"
    });
  }
  return key;
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function readSeedanceError(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return { message: fallback, code: "SEEDANCE_API_ERROR" };
  const record = body as SeedanceErrorBody;
  return {
    message: record.error?.message?.trim() || fallback,
    code: record.error?.code?.trim() || "SEEDANCE_API_ERROR",
    required: record.error?.required,
    available: record.error?.available,
    retryAfter: record.error?.retry_after
  };
}

async function seedanceRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = resolveApiKey();
  const response = await fetch(`${SEEDANCE_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {})
    }
  });

  const body = await parseJsonBody(response);
  if (!response.ok) {
    const error = readSeedanceError(body, `Seedance API request failed (${response.status})`);
    throw new SeedanceApiError({
      status: response.status,
      code:
        response.status === 401
          ? "invalid_api_key"
          : response.status === 402
            ? "insufficient_credits"
            : response.status === 429
              ? "rate_limited"
              : error.code,
      message: error.message,
      required: error.required,
      available: error.available,
      retryAfter: error.retryAfter
    });
  }

  return body as T;
}

export function resolveSeedanceApiModelId(internalModelId: string): SeedanceApiModelId {
  const variant = normalizeSeedanceModelId(internalModelId);
  if (variant === "seedance-2.0-fast") return "seedance-2-0-fast";
  if (variant === "seedance-2.0-mini") return "seedance-2-0-mini";
  return "seedance-2-0";
}

export function isSeedanceVideoProvider(provider: string) {
  const normalized = provider.trim().toLowerCase();
  return normalized === "seedance" || normalized === "bytedance";
}

export function isSeedanceVideoModel(modelId: string) {
  return normalizeSeedanceModelId(modelId) != null;
}

export function seedanceDefaultCallbackUrl() {
  return readSeedanceCallbackUrl();
}

export async function seedanceCreateVideoTask(input: {
  model: SeedanceApiModelId;
  callbackUrl?: string | null;
  input: SeedanceVideoInput;
}) {
  const callback_url = input.callbackUrl ?? seedanceDefaultCallbackUrl() ?? undefined;
  const response = await seedanceRequest<SeedanceCreateTaskResponse>("/v1/videos/generations", {
    method: "POST",
    body: JSON.stringify({
      model: input.model,
      ...(callback_url ? { callback_url } : {}),
      input: input.input
    })
  });

  if (!response.taskId?.trim()) {
    throw new SeedanceApiError({
      status: 502,
      code: "SEEDANCE_INVALID_CREATE_RESPONSE",
      message: "Seedance create response missing taskId"
    });
  }

  return response;
}

export async function seedanceGetTask(taskId: string) {
  return seedanceRequest<SeedanceTask>(`/v1/tasks/${encodeURIComponent(taskId)}`, {
    method: "GET"
  });
}

export function isSeedanceTaskTerminal(status: SeedanceTaskStatus) {
  return status === "completed" || status === "failed";
}

export function seedanceTaskProgress(status: SeedanceTaskStatus) {
  switch (status) {
    case "queued":
      return 30;
    case "generating":
      return 65;
    case "completed":
      return 100;
    default:
      return 40;
  }
}

export function pickSeedanceVideoUrl(task: SeedanceTask) {
  const url = task.data?.results?.find((item) => typeof item === "string" && item.trim());
  return url?.trim() || null;
}

export async function seedancePollTask(input: {
  taskId: string;
  timeoutMs?: number;
  intervalMs?: number;
  onProgress?: (task: SeedanceTask) => void | Promise<void>;
}) {
  const timeoutMs = input.timeoutMs ?? 15 * 60_000;
  const intervalMs = Math.max(input.intervalMs ?? 10_000, 10_000);
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const task = await seedanceGetTask(input.taskId);
    await input.onProgress?.(task);

    if (task.status === "completed") {
      const videoUrl = pickSeedanceVideoUrl(task);
      if (!videoUrl) {
        throw new SeedanceApiError({
          status: 502,
          code: "SEEDANCE_NO_VIDEO_URL",
          message: "Seedance task completed but no video URL was returned"
        });
      }
      return { task, videoUrl };
    }

    if (task.status === "failed") {
      throw new SeedanceApiError({
        status: 502,
        code: "SEEDANCE_TASK_FAILED",
        message: task.failed_reason?.trim() || task.data?.failed_reason?.trim() || "Seedance task failed"
      });
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new SeedanceApiError({
    status: 504,
    code: "SEEDANCE_TASK_TIMEOUT",
    message: "Timed out waiting for Seedance video generation"
  });
}

export async function seedanceDownloadVideo(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new SeedanceApiError({
      status: response.status,
      code: "SEEDANCE_DOWNLOAD_FAILED",
      message: `Failed to download generated video (${response.status})`
    });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) {
    throw new SeedanceApiError({
      status: 502,
      code: "SEEDANCE_EMPTY_VIDEO",
      message: "Downloaded video file is empty"
    });
  }

  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  const mimeType =
    contentType === "video/quicktime"
      ? "video/quicktime"
      : contentType === "video/webm"
        ? "video/webm"
        : "video/mp4";

  logger.info("Seedance video downloaded", {
    service: "seedance-client",
    bytes: buffer.length,
    mimeType
  });

  return { buffer, mimeType };
}
