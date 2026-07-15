import { adminMutationHeaders } from "@/lib/studioos/admin-csrf-client";
import { KNOWLEDGE_COVER_MAX_BYTES, KNOWLEDGE_INLINE_IMAGE_MAX_BYTES, KNOWLEDGE_ACCEPTED_IMAGE_ACCEPT } from "@/lib/knowledge/knowledge-editor.constants";

export { KNOWLEDGE_ACCEPTED_IMAGE_ACCEPT };
export const KNOWLEDGE_ACCEPTED_IMAGE_TYPES = KNOWLEDGE_ACCEPTED_IMAGE_ACCEPT;

export function knowledgeAcceptedImageHint(zh: boolean) {
  return zh
    ? "推荐 1280×630px，最大 4MB，支持 JPG、PNG、WebP、GIF（iPhone 照片请先导出为 JPG）"
    : "Recommended 1280×630, max 4MB, JPG/PNG/WebP/GIF (export iPhone photos as JPG first)";
}

export function formatKnowledgeUploadError(raw: string, zh: boolean) {
  const message = raw.trim();
  if (!message) return zh ? "上传失败，请重试" : "Upload failed — try again";

  if (message.includes("timed out") || message.includes("Timeout")) {
    return zh
      ? "上传超时，请压缩图片或检查网络后重试"
      : "Upload timed out — compress the image or check your network";
  }
  if (message.includes("Upload cancelled") || message.includes("cancelled")) {
    return zh ? "上传已取消" : "Upload cancelled";
  }
  if (message.includes("Invalid CSRF") || message.includes("CSRF")) {
    return zh ? "登录状态已过期，请刷新页面后重新上传" : "Session expired — refresh the page and try again";
  }
  if (message.includes("Durable object storage") || message.includes("R2 upload failed")) {
    return zh
      ? "图片存储未配置或不可用，请联系管理员配置 R2 对象存储"
      : "Image storage is not configured — contact an admin to set up R2";
  }
  if (message.includes("HEIC") || message.includes("HEIF")) {
    return zh ? "不支持 HEIC/HEIF，请先在「照片」中导出为 JPG 或 PNG" : "HEIC/HEIF is not supported — export as JPG or PNG first";
  }
  if (message.includes("Only JPEG") || message.includes("supported")) {
    return zh ? "仅支持 JPG、PNG、WebP、GIF 格式" : "Only JPG, PNG, WebP, and GIF are supported";
  }
  if (message.includes("under 4MB") || message.includes("under 5MB") || message.includes("too large")) {
    return zh ? "图片过大，请压缩后重试（封面最大 4MB）" : "Image is too large — compress and retry (cover max 4MB)";
  }
  if (message.includes("Empty file")) {
    return zh ? "文件为空，请重新选择" : "Empty file — choose another image";
  }

  return message;
}

type UploadResult = {
  url: string;
  publicUrl?: string;
  key?: string;
  width?: number | null;
  height?: number | null;
  mimeType?: string;
  fallback_url?: string;
};

type UploadOptions = {
  signal?: AbortSignal;
};

const UPLOAD_TIMEOUT_MS = {
  cover: 90_000,
  inline: 60_000
} as const;

function mergeUploadSignals(external: AbortSignal | undefined, kind: "cover" | "inline"): AbortSignal {
  const timeoutMs = UPLOAD_TIMEOUT_MS[kind];
  if (typeof AbortSignal.timeout === "function") {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    if (!external) return timeoutSignal;
    const merged = new AbortController();
    const abort = () => merged.abort();
    timeoutSignal.addEventListener("abort", abort, { once: true });
    external.addEventListener("abort", abort, { once: true });
    return merged.signal;
  }

  const merged = new AbortController();
  const timer = setTimeout(() => merged.abort(), timeoutMs);
  const abort = () => {
    clearTimeout(timer);
    merged.abort();
  };
  if (external) external.addEventListener("abort", abort, { once: true });
  return merged.signal;
}

function uploadFetchError(error: unknown, zh: boolean): Error {
  if (error instanceof DOMException) {
    if (error.name === "TimeoutError") {
      return new Error(formatKnowledgeUploadError("Upload timed out", zh));
    }
    if (error.name === "AbortError") {
      return new Error(formatKnowledgeUploadError("Upload cancelled", zh));
    }
  }
  if (error instanceof Error) return error;
  return new Error(formatKnowledgeUploadError(zh ? "上传失败" : "Upload failed", zh));
}

export async function uploadKnowledgeImage(
  file: File,
  kind: "cover" | "inline",
  zh: boolean,
  options?: UploadOptions
): Promise<UploadResult> {
  const maxBytes = kind === "inline" ? KNOWLEDGE_INLINE_IMAGE_MAX_BYTES : KNOWLEDGE_COVER_MAX_BYTES;
  if (!file.size) throw new Error(formatKnowledgeUploadError("Empty file", zh));
  if (file.size > maxBytes) {
    throw new Error(formatKnowledgeUploadError(kind === "inline" ? "Inline image must be under 5MB" : "Cover image must be under 4MB", zh));
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);

  const response = await fetch("/api/admin/knowledge/upload", {
    method: "POST",
    headers: adminMutationHeaders(),
    body: formData,
    credentials: "same-origin",
    signal: mergeUploadSignals(options?.signal, kind)
  }).catch((error) => {
    throw uploadFetchError(error, zh);
  });

  const body = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: {
      url?: string;
      publicUrl?: string;
      key?: string;
      width?: number | null;
      height?: number | null;
      mimeType?: string;
      fallback_url?: string;
    };
    error?: string | { code?: string; message?: string };
    message?: string;
  } | null;

  if (!response.ok || body?.success === false || !body?.data?.url) {
    const apiError =
      typeof body?.error === "string"
        ? body.error
        : body?.error?.message ?? body?.message ?? (zh ? "上传失败" : "Upload failed");
    if (response.status === 403) {
      throw new Error(formatKnowledgeUploadError("Invalid CSRF token", zh));
    }
    throw new Error(formatKnowledgeUploadError(apiError, zh));
  }

  const publicUrl = body.data.publicUrl ?? body.data.url;
  return {
    url: publicUrl,
    publicUrl,
    key: body.data.key,
    width: body.data.width,
    height: body.data.height,
    mimeType: body.data.mimeType,
    fallback_url: body.data.fallback_url
  };
}
