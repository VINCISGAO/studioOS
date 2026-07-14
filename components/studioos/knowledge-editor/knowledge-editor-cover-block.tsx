"use client";

import { KnowledgeEditorCard } from "@/components/studioos/knowledge-editor/knowledge-editor-ui-primitives";
import { useKnowledgeEditorImageUpload } from "@/hooks/use-knowledge-editor-image-upload";
import { KNOWLEDGE_ACCEPTED_IMAGE_ACCEPT, knowledgeAcceptedImageHint } from "@/lib/knowledge/knowledge-upload-client";
import type { Locale } from "@/lib/i18n";
import { AlertCircle, ImagePlus } from "lucide-react";
import { useId } from "react";

type Props = {
  locale: Locale;
  value: string;
  onChange: (value: { url: string; fallback_url?: string }) => void;
  onNotify: (message: string, variant: "success" | "error" | "info", detail?: string) => void;
};

export function KnowledgeEditorCoverBlock({ locale, value, onChange, onNotify }: Props) {
  const zh = locale === "zh";
  const inputId = useId();
  const { uploading, error, upload } = useKnowledgeEditorImageUpload("cover", zh);

  async function handleFile(file: File) {
    try {
      const result = await upload(file);
      onChange({ url: result.url, fallback_url: result.fallback_url });
      onNotify(zh ? "封面上传成功" : "Cover uploaded", "success");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : zh ? "上传失败" : "Upload failed";
      onNotify(zh ? "封面上传失败" : "Cover upload failed", "error", message);
    }
  }

  return (
    <KnowledgeEditorCard title={zh ? "封面图" : "Cover image"}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <label
          htmlFor={inputId}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          className={
            uploading
              ? "flex min-h-[180px] cursor-wait flex-col items-center justify-center rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-4 text-center text-sm text-zinc-500 opacity-60"
              : "flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-4 text-center text-sm text-zinc-500 transition hover:border-violet-300 hover:bg-violet-50"
          }
        >
          <ImagePlus className="mb-3 h-8 w-8 text-violet-400" />
          <p>{uploading ? (zh ? "上传中…" : "Uploading…") : zh ? "拖拽图片到此处，或点击上传" : "Drag an image here or click to upload"}</p>
          <p className="mt-2 text-xs text-zinc-400">{knowledgeAcceptedImageHint(zh)}</p>
        </label>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-zinc-500">{zh ? "封面预览" : "Cover preview"}</p>
            {value ? (
              <button
                type="button"
                onClick={() => onChange({ url: "", fallback_url: "" })}
                className="text-xs text-rose-600 hover:underline"
              >
                {zh ? "删除封面" : "Remove cover"}
              </button>
            ) : null}
          </div>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="aspect-[16/9] w-full rounded-lg object-cover" />
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white text-xs text-zinc-400">
              {zh ? "未选择图片" : "No image selected"}
            </div>
          )}
        </div>
      </div>
      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      <input
        id={inputId}
        type="file"
        accept={KNOWLEDGE_ACCEPTED_IMAGE_ACCEPT}
        className="sr-only"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.currentTarget.value = "";
        }}
      />
    </KnowledgeEditorCard>
  );
}
