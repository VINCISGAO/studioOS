"use client";

import { adminMutationHeaders, readAdminCsrfToken } from "@/lib/studioos/admin-csrf-client";
import { KNOWLEDGE_COVER_MAX_BYTES } from "@/lib/knowledge/knowledge-editor.constants";
import type { Locale } from "@/lib/i18n";
import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type CoverValue = {
  url: string;
  fallback_url?: string;
};

type Props = {
  locale: Locale;
  value: string;
  fallbackUrl?: string;
  onChange: (value: CoverValue) => void;
};

function parseUploadError(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;
  const record = body as {
    error?: string | { message?: string; code?: string };
    success?: boolean;
  };
  if (typeof record.error === "string") return record.error;
  if (record.error?.message) return record.error.message;
  return fallback;
}

export function KnowledgeEditorCover({ locale, value, fallbackUrl, onChange }: Props) {
  const zh = locale === "zh";
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    if (!readAdminCsrfToken()) {
      setError(zh ? "安全令牌未就绪，请刷新页面后重试" : "Security token not ready — refresh and try again");
      return;
    }
    if (file.size > KNOWLEDGE_COVER_MAX_BYTES) {
      setError(zh ? "封面需小于 4MB" : "Cover must be under 4MB");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/knowledge/upload", {
        method: "POST",
        headers: adminMutationHeaders(),
        body: formData
      });
      const body = (await response.json().catch(() => null)) as {
        data?: { url?: string; fallback_url?: string };
        error?: string | { message?: string };
      } | null;
      if (!response.ok || !body?.data?.url) {
        throw new Error(parseUploadError(body, zh ? "上传失败" : "Upload failed"));
      }
      onChange({ url: body.data.url, fallback_url: body.data.fallback_url });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : zh ? "上传失败" : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function openPicker() {
    if (uploading) return;
    inputRef.current?.click();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{zh ? "封面图" : "Cover Image"}</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {zh ? "推荐 1600×900 · PNG/JPG/WebP · <4MB" : "Recommended 1600×900 · PNG/JPG/WebP · <4MB"}
          </p>
        </div>
        {value ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openPicker} disabled={uploading}>
              <ImagePlus className="mr-1 h-4 w-4" />
              {uploading ? (zh ? "上传中…" : "Uploading…") : zh ? "更换" : "Replace"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ url: "", fallback_url: "" })}
              disabled={uploading}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {zh ? "删除" : "Remove"}
            </Button>
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.currentTarget.value = "";
        }}
      />

      {value ? (
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className="mt-4 block w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 text-left transition hover:border-[#5B5CEB] disabled:opacity-60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="aspect-[16/9] w-full object-cover" />
          {fallbackUrl ? (
            <p className="border-t border-zinc-200 px-3 py-2 text-[11px] text-zinc-500">
              {zh ? "已生成 WebP/AVIF，原图已保留" : "WebP/AVIF generated; original kept as fallback"}
            </p>
          ) : null}
        </button>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file) void upload(file);
          }}
          disabled={uploading}
          className="mt-4 flex min-h-[180px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 transition hover:border-[#5B5CEB] hover:bg-violet-50/40 disabled:opacity-60"
        >
          <ImagePlus className="mb-2 h-6 w-6 text-zinc-400" />
          {uploading ? (zh ? "上传中…" : "Uploading…") : zh ? "点击或拖拽上传封面" : "Click or drag to upload cover"}
        </button>
      )}
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </section>
  );
}
