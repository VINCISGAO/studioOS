import type { Locale } from "@/lib/i18n";
import { MAX_DELIVERABLE_VIDEO_BYTES } from "@/lib/studioos/deliverable-video-policy-shared";

const ACCEPTED_MIME = new Set(["video/mp4", "video/quicktime"]);
const ACCEPTED_EXT = [".mp4", ".mov"];

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
    return locale === "zh" ? "文件超过 300MB 上限" : "File exceeds the 300 MB limit";
  }
  if (file.size <= 0) {
    return locale === "zh" ? "文件无效" : "Invalid file";
  }
  return null;
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
