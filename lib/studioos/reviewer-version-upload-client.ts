import type { Locale } from "@/lib/i18n";
import {
  MAX_DELIVERABLE_VIDEO_BYTES,
  maxDeliverableVideoLabel
} from "@/lib/studioos/deliverable-video-policy-shared";

const ACCEPTED_MIME = new Set(["video/mp4", "video/quicktime"]);
const ACCEPTED_EXT = [".mp4", ".mov"];
const MULTIPART_THRESHOLD_BYTES = 6 * 1024 * 1024;
const MULTIPART_CONCURRENCY = 4;

export function formatUploadBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

export function validateReviewerVideoFile(file: File, locale: Locale): string | null {
  const name = file.name.toLowerCase();
  const typeOk = ACCEPTED_MIME.has(file.type) || ACCEPTED_EXT.some((ext) => name.endsWith(ext));
  if (!typeOk) {
    return locale === "zh" ? "仅支持 MP4 / MOV 格式" : "Only MP4 / MOV files are supported";
  }
  if (file.size > MAX_DELIVERABLE_VIDEO_BYTES) {
    return locale === "zh"
      ? `文件超过 ${maxDeliverableVideoLabel("zh")} 上限`
      : `File exceeds the ${maxDeliverableVideoLabel("en")} limit`;
  }
  if (file.size <= 0) {
    return locale === "zh" ? "文件无效" : "Invalid file";
  }
  return null;
}

type MultipartUploadPart = { partNumber: number; etag: string };

export async function uploadReviewVideoInParts(
  orderId: string,
  file: File,
  onProgress: (loaded: number, total: number) => void
): Promise<
  | { ok: true; url: string; version: number; fileName: string }
  | { ok: false; error: string }
> {
  const initRes = await fetch("/api/delivery/upload-video/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: orderId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || "application/octet-stream"
    })
  });
  const init = (await initRes.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
    upload_id?: string;
    key?: string;
    version?: number;
    url?: string;
    part_size?: number;
  } | null;
  if (!initRes.ok || !init?.ok || !init.upload_id || !init.key || !init.version) {
    return { ok: false, error: init?.error ?? "Upload failed" };
  }

  const uploadId = init.upload_id;
  const uploadKey = init.key;
  const uploadVersion = init.version;
  const partSize = init.part_size ?? MULTIPART_THRESHOLD_BYTES;
  const parts: MultipartUploadPart[] = [];
  const totalParts = Math.ceil(file.size / partSize);
  let uploaded = 0;
  let nextPartNumber = 1;

  async function uploadPart(partNumber: number) {
    const offset = (partNumber - 1) * partSize;
    const chunk = file.slice(offset, Math.min(offset + partSize, file.size));
    const partRes = await fetch(
      `/api/delivery/upload-video/part?uploadId=${encodeURIComponent(uploadId)}&key=${encodeURIComponent(uploadKey)}&partNumber=${partNumber}`,
      {
        method: "PUT",
        body: chunk
      }
    );
    const part = (await partRes.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      part?: MultipartUploadPart;
    } | null;
    if (!partRes.ok || !part?.ok || !part.part) {
      return { ok: false, error: part?.error ?? "Upload failed" };
    }
    parts.push(part.part);
    uploaded += chunk.size;
    onProgress(Math.min(uploaded, file.size), file.size);
    return { ok: true as const };
  }

  async function worker(): Promise<{ ok: true } | { ok: false; error: string }> {
    while (nextPartNumber <= totalParts) {
      const partNumber = nextPartNumber;
      nextPartNumber += 1;
      const result = await uploadPart(partNumber);
      if (!result.ok) return result;
    }
    return { ok: true };
  }

  const workers = Array.from(
    { length: Math.min(MULTIPART_CONCURRENCY, totalParts) },
    () => worker()
  );
  const results = await Promise.all(workers);
  const failed = results.find((result): result is { ok: false; error: string } => !result.ok);
  if (failed) return failed;

  const completeRes = await fetch("/api/delivery/upload-video/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      upload_id: uploadId,
      order_id: orderId,
      key: uploadKey,
      version: uploadVersion,
      parts
    })
  });
  const complete = (await completeRes.json().catch(() => null)) as {
    ok?: boolean;
    url?: string;
    error?: string;
  } | null;
  if (!completeRes.ok || !complete?.ok || !complete.url) {
    return { ok: false, error: complete?.error ?? "Upload failed" };
  }

  return {
    ok: true,
    url: complete.url,
    version: init.version,
    fileName: file.name
  };
}

export function uploadReviewVideoFile(
  orderId: string,
  file: File,
  onProgress: (loaded: number, total: number) => void,
  registerXhr?: (xhr: XMLHttpRequest) => void
): Promise<
  | { ok: true; url: string; version: number; fileName: string }
  | { ok: false; error: string }
> {
  if (file.size > MULTIPART_THRESHOLD_BYTES) {
    return uploadReviewVideoInParts(orderId, file, onProgress);
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    registerXhr?.(xhr);

    const fd = new FormData();
    fd.set("order_id", orderId);
    fd.set("video_file", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      onProgress(event.loaded, event.total);
    });

    xhr.addEventListener("load", () => {
      try {
        const payload = JSON.parse(xhr.responseText) as {
          ok?: boolean;
          url?: string;
          version?: number;
          file_name?: string;
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && payload.ok && payload.url && payload.version) {
          resolve({
            ok: true,
            url: payload.url,
            version: payload.version,
            fileName: payload.file_name ?? file.name
          });
          return;
        }
        resolve({
          ok: false,
          error: payload.error ?? (xhr.status === 401 ? "Unauthorized" : "Upload failed")
        });
      } catch {
        resolve({ ok: false, error: "Upload failed" });
      }
    });

    xhr.addEventListener("error", () => resolve({ ok: false, error: "Upload failed" }));
    xhr.addEventListener("abort", () => resolve({ ok: false, error: "Cancelled" }));

    xhr.open("POST", "/api/delivery/upload-video");
    xhr.send(fd);
  });
}

export function animateUploadProgress(
  durationMs: number,
  onTick: (progress: number) => void,
  onDone: () => void
): () => void {
  const start = Date.now();
  const timer = window.setInterval(() => {
    const elapsed = Date.now() - start;
    const progress = Math.min(100, Math.round((elapsed / durationMs) * 100));
    onTick(progress);
    if (progress >= 100) {
      window.clearInterval(timer);
      onDone();
    }
  }, 150);
  return () => window.clearInterval(timer);
}
