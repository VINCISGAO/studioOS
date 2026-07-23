"use client";

import { useRef } from "react";
import {
  BookOpen,
  Lightbulb,
  LoaderCircle,
  Plus,
  Send,
  Sparkles,
  X
} from "lucide-react";
import type { CanvasChatReference } from "@/components/canvas/hooks/use-canvas-chat-reference";
import {
  canvasChatInputIconButtonClass,
  canvasChatInputShellClass,
  canvasChatSendButtonClass
} from "@/lib/canvas/canvas-chat-design";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function CanvasChatInput({
  locale,
  value,
  busy,
  reference,
  uploadingReference,
  onChange,
  onReferenceFileSelected,
  onClearReference,
  onSubmit
}: {
  locale: Locale;
  value: string;
  busy: boolean;
  reference: CanvasChatReference | null;
  uploadingReference: boolean;
  onChange: (value: string) => void;
  onReferenceFileSelected: (file: File) => void;
  onClearReference: () => void;
  onSubmit: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSubmit = (value.trim().length > 0 || reference) && !busy && !uploadingReference;

  return (
    <div className="shrink-0 bg-[#f9fafb] p-4 pt-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.currentTarget.value = "";
          if (file) onReferenceFileSelected(file);
        }}
      />
      <div className={canvasChatInputShellClass}>
        {reference ? (
          <div className="mb-2 flex items-start gap-2">
            <div className="relative shrink-0">
              <img
                src={reference.url}
                alt={reference.fileName}
                className="h-16 w-16 rounded-xl object-cover ring-1 ring-violet-100"
              />
              <button
                type="button"
                onClick={onClearReference}
                className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white"
                aria-label={locale === "zh" ? "移除参考图" : "Remove reference"}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-[11px] font-medium text-zinc-700">
                {locale === "zh" ? "参考图" : "Reference image"}
              </p>
              <p className="truncate text-[10px] text-zinc-400">{reference.fileName}</p>
            </div>
          </div>
        ) : null}
        {uploadingReference ? (
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[11px] text-violet-600">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            {locale === "zh" ? "正在上传参考图…" : "Uploading reference…"}
          </div>
        ) : null}
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          maxLength={4000}
          placeholder={
            reference
              ? locale === "zh"
                ? "描述你想如何基于参考图生成，例如：改成雪景、保留构图换风格"
                : "Describe how to transform the reference, e.g. snowy scene, new style"
              : locale === "zh"
                ? "从一个想法开始，或输入 @ 提及"
                : "Start with an idea, or type '@' to mention"
          }
          className="min-h-[56px] w-full resize-none bg-transparent text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (canSubmit) onSubmit();
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy || uploadingReference}
              className={cn(
                canvasChatInputIconButtonClass,
                reference && "bg-violet-50 text-violet-600",
                (busy || uploadingReference) && "opacity-40"
              )}
              aria-label={locale === "zh" ? "上传参考图" : "Upload reference image"}
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={canvasChatInputIconButtonClass}
              aria-label={locale === "zh" ? "Skills" : "Skills"}
            >
              <BookOpen className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className={canvasChatInputIconButtonClass}
              aria-label={locale === "zh" ? "灵感" : "Ideas"}
            >
              <Lightbulb className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={canvasChatInputIconButtonClass}
              aria-label={locale === "zh" ? "工具" : "Tools"}
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={onSubmit}
              className={canvasChatSendButtonClass}
              aria-label={locale === "zh" ? "发送" : "Send"}
            >
              {busy ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
