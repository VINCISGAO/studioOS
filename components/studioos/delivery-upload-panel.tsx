"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadVideoVersionAction } from "@/app/review-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DeliverableVideoPolicyNotice } from "@/components/studioos/deliverable-video-policy-notice";
import type { Locale } from "@/lib/i18n";
import { maxDeliverableVideoLabel } from "@/lib/studioos/deliverable-video-policy-shared";
import { uploadReviewVideoFile } from "@/lib/studioos/reviewer-version-upload-client";
import { cn } from "@/lib/utils";
import { FileVideo2, Loader2, UploadCloud, X } from "lucide-react";

const copy = {
  en: {
    firstTitle: "Upload review version",
    firstSubtitle: "Submit Version 1 to generate a watermarked review copy for the brand.",
    revisionTitle: "Upload new review version",
    revisionSubtitle: `Drag MP4 / MOV or paste a video URL. Max ${maxDeliverableVideoLabel("en")}.`,
    dropHere: "Drop MP4 here",
    browse: "or click to browse",
    orUrl: "Or paste video URL",
    urlPlaceholder: "https://cdn.example.com/first-cut.mp4",
    notes: "Version notes (optional)",
    notesPlaceholder: "What should the brand know about this cut?",
    notesAutoTranslate: "Write in your language — we'll auto-translate for the brand.",
    submitFirst: "Create review version",
    submitRevision: "Send for review",
    uploading: "Uploading…",
    nextVersion: (v: number) => `Creates Version ${v}`
  },
  zh: {
    firstTitle: "上传审片版",
    firstSubtitle: "提交 Version 1，系统将生成带水印的审片版供品牌审阅。",
    revisionTitle: "上传新审片版",
    revisionSubtitle: `拖拽 MP4 / MOV 或粘贴视频链接，单文件最大 ${maxDeliverableVideoLabel("zh")}。`,
    dropHere: "拖拽 MP4 到此处",
    browse: "或点击选择文件",
    orUrl: "或粘贴视频链接",
    urlPlaceholder: "https://cdn.example.com/first-cut.mp4",
    notes: "版本说明（可选）",
    notesPlaceholder: "这版改了什么？品牌审片时会看到。",
    notesAutoTranslate: "用你自己的语言写即可，系统会自动翻译成品牌方语言。",
    submitFirst: "创建审片版",
    submitRevision: "发送审片",
    uploading: "上传中…",
    nextVersion: (v: number) => `将创建 Version ${v}`
  }
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DeliveryUploadPanel({
  locale,
  orderId,
  nextVersion,
  mode = "revision",
  onSuccess
}: {
  locale: Locale;
  orderId: string;
  nextVersion: number;
  mode?: "first" | "revision";
  onSuccess?: () => void;
}) {
  const t = copy[locale];
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    if (!file && !fileUrl.trim()) {
      setError(locale === "zh" ? "请上传 MP4 或填写视频链接" : "Upload an MP4 or provide a video URL");
      return;
    }

    startTransition(async () => {
      setError(null);
      setSuccess(null);

      let resolvedUrl = fileUrl.trim();

      if (file) {
        try {
          const uploadResult = await uploadReviewVideoFile(orderId, file, () => undefined);
          if (!uploadResult.ok) {
            throw new Error(
              uploadResult.error ??
                (locale === "zh" ? "视频上传失败，请重试" : "Video upload failed — try again")
            );
          }
          resolvedUrl = uploadResult.url;
        } catch (uploadError) {
          setError(
            uploadError instanceof Error
              ? uploadError.message
              : locale === "zh"
                ? "视频上传失败，请重试"
                : "Video upload failed — try again"
          );
          return;
        }
      }

      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      fd.set("file_url", resolvedUrl);
      fd.set("notes", notes.trim());

      const result = await uploadVideoVersionAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFile(null);
      setFileUrl("");
      setNotes("");
      form.reset();
      setSuccess(
        locale === "zh"
          ? result.translated
            ? `Version ${result.deliverable.version} 已提交，已通知品牌方审片，版本说明已自动翻译。`
            : `Version ${result.deliverable.version} 已提交，已通知品牌方，可以进入审片环节。`
          : result.translated
            ? `Version ${result.deliverable.version} submitted — brand notified, notes translated.`
            : `Version ${result.deliverable.version} submitted — brand notified, open review when ready.`
      );
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">
          {mode === "first" ? t.firstTitle : t.revisionTitle}
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          {mode === "first" ? t.firstSubtitle : t.revisionSubtitle}
        </p>
        <p className="mt-1 text-xs font-medium text-emerald-700">{t.nextVersion(nextVersion)}</p>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p> : null}

      <DeliverableVideoPolicyNotice locale={locale} showUploadLimit className="text-xs leading-5" />

      <input
        ref={inputRef}
        type="file"
        name="video_file"
        accept="video/mp4,.mp4"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) setFile(picked);
        }}
      />

      {file ? (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <FileVideo2 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">{file.name}</p>
            <p className="text-xs text-zinc-500">{formatFileSize(file.size)} · MP4</p>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={() => setFile(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const picked = e.dataTransfer.files?.[0];
            if (picked) setFile(picked);
          }}
          className={cn(
            "flex min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
            dragging
              ? "border-zinc-900 bg-zinc-50"
              : "border-zinc-300 bg-zinc-50/80 hover:border-zinc-400 hover:bg-zinc-50",
            mode === "first" && "min-h-[240px] border-zinc-400 bg-white"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg",
              mode === "first" ? "h-14 w-14" : "h-12 w-12"
            )}
          >
            <UploadCloud className={mode === "first" ? "h-7 w-7" : "h-5 w-5"} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">{t.dropHere}</p>
            <p className="mt-1 text-xs text-zinc-500">{t.browse}</p>
          </div>
        </button>
      )}

      <div className="grid gap-2">
        <Label htmlFor={`file_url_${orderId}`}>{t.orUrl}</Label>
        <Input
          id={`file_url_${orderId}`}
          name="file_url"
          type="url"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder={t.urlPlaceholder}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`notes_${orderId}`}>{t.notes}</Label>
        <p className="text-xs text-zinc-500">{t.notesAutoTranslate}</p>
        <Textarea
          id={`notes_${orderId}`}
          name="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.notesPlaceholder}
        />
      </div>

      <Button type="submit" size="lg" className="w-full rounded-full sm:w-auto" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
        {isPending ? t.uploading : mode === "first" ? t.submitFirst : t.submitRevision}
      </Button>
    </form>
  );
}
