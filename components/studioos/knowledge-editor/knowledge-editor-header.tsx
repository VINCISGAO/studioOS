"use client";

import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import {
  KNOWLEDGE_PUBLISH_STEP_LABELS,
  KNOWLEDGE_PUBLISH_STEPS
} from "@/features/knowledge-center/knowledge-publish.pipeline.shared";
import type { Locale } from "@/lib/i18n";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  Loader2,
  PencilLine,
  Save,
  Wand2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HEADER_PIPELINE_CHIPS = [
  { key: "seo", zh: "SEO 元数据", en: "SEO metadata" },
  { key: "multilingual", zh: "11 语言 GPT", en: "11-language GPT" },
  { key: "sitemap", zh: "Sitemap.xml", en: "Sitemap.xml" },
  { key: "rss", zh: "RSS Feed", en: "RSS Feed" },
  { key: "schema", zh: "Schema.org", en: "Schema.org" },
  { key: "llms", zh: "llms.txt", en: "llms.txt" },
  { key: "lucien", zh: "Lucien 同步", en: "Lucien sync" }
] as const;

function formatSaveTimestamp(date: Date, locale: Locale) {
  const zh = locale === "zh";
  const time = date.toLocaleTimeString(zh ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60_000));
  const relative =
    diffMinutes < 60
      ? zh
        ? `${diffMinutes} 分钟前`
        : `${diffMinutes}m ago`
      : zh
        ? `${Math.floor(diffMinutes / 60)} 小时前`
        : `${Math.floor(diffMinutes / 60)}h ago`;
  return `${time} · ${relative}`;
}

export function KnowledgeEditorHeader({
  locale,
  title,
  subtitle,
  saveState,
  lastSavedAt,
  publishDisabled,
  saving,
  onPreview,
  onSaveDraft,
  onPublish,
  className
}: {
  locale: Locale;
  title: string;
  subtitle: string;
  saveState: "idle" | "saving" | "saved";
  lastSavedAt: Date | null;
  publishDisabled: boolean;
  saving: boolean;
  onPreview: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  className?: string;
}) {
  const zh = locale === "zh";

  const saveLabel =
    saveState === "saving"
      ? zh
        ? "保存中…"
        : "Saving…"
      : saveState === "saved"
        ? zh
          ? "已保存"
          : "Saved"
        : null;

  return (
    <header
      className={cn(
        "overflow-hidden rounded-2xl border border-zinc-200/80 bg-white px-6 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] max-xl:sticky max-xl:top-0 max-xl:z-10",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={adminPortalRoutes.knowledge}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {zh ? "返回" : "Back"}
        </Link>

        {saveLabel || lastSavedAt ? (
          <div className="order-last flex w-full justify-center sm:order-none sm:w-auto sm:flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs">
              {saveState === "saving" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#5B5CEB]" />
              ) : saveState === "saved" ? (
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              ) : null}
              {saveLabel ? <span className="font-medium text-emerald-600">{saveLabel}</span> : null}
              {lastSavedAt ? (
                <span className="text-zinc-400">{formatSaveTimestamp(lastSavedAt, locale)}</span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="hidden flex-1 sm:block" />
        )}

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-lg border-zinc-200 bg-white px-3.5 text-zinc-700 shadow-none hover:bg-zinc-50"
            onClick={onSaveDraft}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {zh ? "保存草稿" : "Save Draft"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-lg border-zinc-200 bg-white px-3.5 text-zinc-700 shadow-none hover:bg-zinc-50"
            onClick={onPreview}
          >
            <Eye className="h-4 w-4" />
            {zh ? "预览" : "Preview"}
          </Button>
          <Button
            type="button"
            className={cn(
              "h-9 gap-2 rounded-lg px-4 shadow-sm",
              publishDisabled || saving
                ? "bg-zinc-300 text-white hover:bg-zinc-300"
                : "bg-zinc-950 text-white hover:bg-zinc-800"
            )}
            onClick={onPublish}
            disabled={saving || publishDisabled}
          >
            {zh ? "发布文章" : "Publish"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100">
          <PencilLine className="h-5 w-5 text-violet-600" />
        </div>
        <div className="min-w-0 pt-0.5">
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-zinc-950">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{subtitle}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <details className="group relative">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-100 [&::-webkit-details-marker]:hidden">
            <Wand2 className="h-3.5 w-3.5" />
            {zh ? "发布后将自动执行以下流程" : "Auto-runs after publish"}
            <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
          </summary>
          <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg">
            <ul className="max-h-56 space-y-1.5 overflow-auto text-xs leading-5 text-zinc-600">
              {KNOWLEDGE_PUBLISH_STEPS.map((step) => (
                <li key={step} className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-50">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5B5CEB]" />
                  <span>{KNOWLEDGE_PUBLISH_STEP_LABELS[step][zh ? "zh" : "en"]}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>

        {HEADER_PIPELINE_CHIPS.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-500"
          >
            <Check className="h-3.5 w-3.5 text-[#5B5CEB]" />
            {chip[zh ? "zh" : "en"]}
          </span>
        ))}
      </div>
    </header>
  );
}
