"use client";

import type { Locale } from "@/lib/i18n";
import { CheckCircle2, FilePenLine, Sparkles } from "lucide-react";

const PIPELINE_ITEMS_ZH = [
  "SEO 元数据",
  "GPT 翻译（11 种语言）",
  "Sitemap.xml",
  "RSS Feed",
  "Schema.org",
  "llms.txt",
  "Lucien 同步"
] as const;

export function KnowledgeEditorHeroSection({ locale, isNew }: { locale: Locale; isNew: boolean }) {
  const zh = locale === "zh";
  if (!isNew) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
          <FilePenLine className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{zh ? "创建文章" : "Create article"}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {zh
              ? "填写中文源码并发布，GPT 将自动翻译并同步到 11 种语言。"
              : "Write source content and publish — GPT will translate and sync to 11 languages."}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-medium text-violet-900">
          <Sparkles className="h-4 w-4 text-violet-600" />
          {zh ? "发布后将自动执行以下流程" : "After publishing, these steps run automatically"}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {PIPELINE_ITEMS_ZH.map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5 text-sm text-violet-800/90">
              <CheckCircle2 className="h-4 w-4 text-violet-500" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
