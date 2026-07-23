import "server-only";
import { MUREKA_API_BASE_URL, readMurekaApiKey } from "@/lib/core/config/mureka-key";
import { logger } from "@/lib/core/logger";

export type MurekaModelId = "auto" | "mureka-7.6" | "mureka-o2" | "mureka-8" | "mureka-9";

export type MurekaTaskStatus =
  | "preparing"
  | "queued"
  | "running"
  | "streaming"
  | "succeeded"
  | "failed"
  | "timeouted"
  | "cancelled";

export type MurekaSongChoice = {
  index?: number;
  id?: string;
  url?: string;
  flac_url?: string;
  wav_url?: string;
  stream_url?: string;
};

export type MurekaAsyncTask = {
  id: string;
  created_at?: number;
  finished_at?: number;
  model?: string;
  status: MurekaTaskStatus;
  failed_reason?: string;
  trace_id?: string;
  choices?: MurekaSongChoice[];
};

export type MurekaLyricsResponse = {
  title?: string;
  lyrics?: string;
};

type MurekaErrorBody = {
  error?: { message?: string };
  trace_id?: string;
};

export class MurekaApiError extends Error {
  readonly status: number;
  readonly traceId?: string;
  readonly code: string;

  constructor(input: { status: number; message: string; traceId?: string; code?: string }) {
    super(input.message);
    this.name = "MurekaApiError";
    this.status = input.status;
    this.traceId = input.traceId;
    this.code = input.code ?? "MUREKA_API_ERROR";
  }
}

function resolveApiKey() {
  const key = readMurekaApiKey();
  if (!key) {
    throw new MurekaApiError({
      status: 500,
      code: "MUREKA_NOT_CONFIGURED",
      message: "MUREKA_API_KEY is not configured"
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

function readErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;
  const record = body as MurekaErrorBody;
  return record.error?.message?.trim() || fallback;
}

function readTraceId(body: unknown) {
  if (!body || typeof body !== "object") return undefined;
  const record = body as MurekaErrorBody;
  return record.trace_id;
}

async function murekaRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = resolveApiKey();
  const response = await fetch(`${MUREKA_API_BASE_URL}${path}`, {
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
    throw new MurekaApiError({
      status: response.status,
      code: response.status === 401 ? "MUREKA_AUTH_FAILED" : "MUREKA_API_ERROR",
      message: readErrorMessage(body, `Mureka API request failed (${response.status})`),
      traceId: readTraceId(body)
    });
  }

  return body as T;
}

export function resolveMurekaModelId(internalModelId: string): MurekaModelId {
  const normalized = internalModelId.trim().toLowerCase();
  if (normalized === "mureka-7.6" || normalized === "v7.5-basic" || normalized.includes("basic")) {
    return "mureka-7.6";
  }
  if (normalized.includes("studio") || normalized === "mureka-8") {
    return "mureka-8";
  }
  if (normalized.includes("v9") || normalized === "mureka-9") {
    return "mureka-9";
  }
  if (normalized.includes("o2") || normalized === "mureka-o2") {
    return "mureka-o2";
  }
  return "auto";
}

export function isMurekaMusicProvider(provider: string) {
  const normalized = provider.trim().toLowerCase();
  return normalized === "mureka" || normalized === "suno";
}

export async function murekaGenerateLyrics(prompt: string) {
  return murekaRequest<MurekaLyricsResponse>("/v1/lyrics/generate", {
    method: "POST",
    body: JSON.stringify({ prompt: prompt.slice(0, 2000) })
  });
}

export async function murekaCreateSongTask(input: {
  lyrics: string;
  model: MurekaModelId;
  prompt?: string;
  gender?: "female" | "male";
  n?: number;
}) {
  return murekaRequest<MurekaAsyncTask>("/v1/song/generate", {
    method: "POST",
    body: JSON.stringify({
      lyrics: input.lyrics.slice(0, 5000),
      model: input.model,
      prompt: input.prompt?.slice(0, 1024),
      gender: input.gender,
      n: input.n ?? 1
    })
  });
}

export async function murekaCreateEasySongTask(input: {
  model: MurekaModelId;
  prompt: string;
  styles?: string[];
  n?: number;
}) {
  return murekaRequest<MurekaAsyncTask>("/v1/song/easy-generate", {
    method: "POST",
    body: JSON.stringify({
      model: input.model,
      prompt: input.prompt.slice(0, 2048),
      styles: input.styles?.length ? input.styles.slice(0, 8) : undefined,
      n: input.n ?? 1
    })
  });
}

export async function murekaCreateInstrumentalTask(input: {
  model: MurekaModelId;
  prompt: string;
  n?: number;
}) {
  return murekaRequest<MurekaAsyncTask>("/v1/instrumental/generate", {
    method: "POST",
    body: JSON.stringify({
      model: input.model,
      prompt: input.prompt.slice(0, 1024),
      n: input.n ?? 1
    })
  });
}

export async function murekaQuerySongTask(taskId: string) {
  return murekaRequest<MurekaAsyncTask>(`/v1/song/query/${encodeURIComponent(taskId)}`, {
    method: "GET"
  });
}

export async function murekaQueryInstrumentalTask(taskId: string) {
  return murekaRequest<MurekaAsyncTask>(`/v1/instrumental/query/${encodeURIComponent(taskId)}`, {
    method: "GET"
  });
}

export function pickMurekaAudioUrl(task: MurekaAsyncTask) {
  const choice = task.choices?.find((item) => item.url || item.wav_url || item.flac_url);
  return choice?.url ?? choice?.wav_url ?? choice?.flac_url ?? null;
}

export function isMurekaTaskTerminal(status: MurekaTaskStatus) {
  return (
    status === "succeeded" ||
    status === "failed" ||
    status === "timeouted" ||
    status === "cancelled"
  );
}

export function murekaTaskProgress(status: MurekaTaskStatus) {
  switch (status) {
    case "preparing":
      return 20;
    case "queued":
      return 30;
    case "running":
      return 55;
    case "streaming":
      return 75;
    case "succeeded":
      return 100;
    default:
      return 40;
  }
}

export async function murekaPollTask(input: {
  kind: "song" | "instrumental";
  taskId: string;
  timeoutMs?: number;
  intervalMs?: number;
  onProgress?: (task: MurekaAsyncTask) => void | Promise<void>;
}) {
  const timeoutMs = input.timeoutMs ?? 8 * 60_000;
  const intervalMs = input.intervalMs ?? 3_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const task =
      input.kind === "song"
        ? await murekaQuerySongTask(input.taskId)
        : await murekaQueryInstrumentalTask(input.taskId);

    await input.onProgress?.(task);

    if (task.status === "succeeded") {
      const audioUrl = pickMurekaAudioUrl(task);
      if (!audioUrl) {
        throw new MurekaApiError({
          status: 502,
          code: "MUREKA_NO_AUDIO_URL",
          message: "Mureka task succeeded but no audio URL was returned"
        });
      }
      return { task, audioUrl };
    }

    if (task.status === "failed" || task.status === "timeouted" || task.status === "cancelled") {
      throw new MurekaApiError({
        status: 502,
        code: "MUREKA_TASK_FAILED",
        message: task.failed_reason?.trim() || `Mureka task ${task.status}`
      });
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new MurekaApiError({
    status: 504,
    code: "MUREKA_TASK_TIMEOUT",
    message: "Timed out waiting for Mureka music generation"
  });
}

export async function murekaDownloadAudio(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new MurekaApiError({
      status: response.status,
      code: "MUREKA_DOWNLOAD_FAILED",
      message: `Failed to download generated audio (${response.status})`
    });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) {
    throw new MurekaApiError({
      status: 502,
      code: "MUREKA_EMPTY_AUDIO",
      message: "Downloaded audio file is empty"
    });
  }

  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  const mimeType =
    contentType === "audio/wav" || contentType === "audio/x-wav"
      ? "audio/wav"
      : contentType === "audio/mp4" || contentType === "audio/x-m4a"
        ? "audio/mp4"
        : "audio/mpeg";

  logger.info("Mureka audio downloaded", {
    service: "mureka-client",
    bytes: buffer.length,
    mimeType
  });

  return { buffer, mimeType };
}
