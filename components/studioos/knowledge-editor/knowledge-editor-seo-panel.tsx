"use client";

import { KnowledgeEditorCard } from "@/components/studioos/knowledge-editor/knowledge-editor-ui-primitives";
import { KnowledgeEditorSeoFields } from "@/components/studioos/knowledge-editor/knowledge-editor-seo-fields";
import { useKnowledgeEditorAiActions } from "@/hooks/use-knowledge-editor-ai-actions";
import { knowledgeEditorSeoChecklist } from "@/lib/knowledge/knowledge-editor-seo-checklist";
import type { KnowledgeEditorPanelForm } from "@/lib/knowledge/knowledge-editor-initial-form";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import type { KnowledgeAiAssistantAction } from "@/features/knowledge-center/knowledge-ai-assistant.types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

type Props = {
  locale: Locale;
  form: KnowledgeEditorPanelForm;
  onChange: (patch: Partial<KnowledgeEditorPanelForm>) => void;
  onNotify: (message: string, variant: "success" | "error" | "info", detail?: string) => void;
};

const AI_ACTIONS: Array<{ action: KnowledgeAiAssistantAction; zh: string; en: string }> = [
  { action: "generate_faq", zh: "生成 FAQ", en: "FAQ" },
  { action: "generate_lucien_summary", zh: "生成 Lucien", en: "Lucien" },
  { action: "improve_writing", zh: "润色正文", en: "Improve writing" }
];

export function KnowledgeEditorSeoPanel({ locale, form, onChange, onNotify }: Props) {
  const zh = locale === "zh";
  const snapshot = useMemo(() => knowledgeEditorSeoChecklist(form, zh), [form, zh]);
  const { score, items, metrics } = snapshot;
  const progressTone = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500";
  const aiReady = Boolean(form.title.trim() && form.body_html.trim());

  const { runningAction, runAction } = useKnowledgeEditorAiActions({
    draft: {
      title: form.title,
      subtitle: form.subtitle,
      slug: form.slug,
      body_markdown: form.body_html,
      seo_title: form.title,
      meta_description: form.subtitle,
      focus_keywords: form.focus_keywords,
      category_slug: form.category_slug,
      tags: form.tags,
      language_code: form.language_code
    },
    zh,
    onPatch: (patch) => {
      const { message, body_markdown, ...fields } = patch;
      const next: Partial<KnowledgeEditorPanelForm> = { ...fields };
      if (body_markdown !== undefined) {
        next.body_html = body_markdown.includes("<") ? body_markdown : `<p>${body_markdown}</p>`;
      }
      if (Object.keys(next).length) onChange(next);
      if (message) onNotify(message, next.faqs || next.focus_keywords || next.body_html ? "success" : "info");
    }
  });

  return (
    <KnowledgeEditorCard title={zh ? "SEO 优化" : "SEO"}>
      <p className="mb-4 text-xs leading-relaxed text-zinc-500">
        {zh
          ? "SEO 标题自动使用文章标题，Meta Description 自动使用副标题（无副标题时用标题）。"
          : "SEO title uses the article title; meta description uses the subtitle (or title if empty)."}
      </p>

      <KnowledgeEditorSeoFields
        locale={locale}
        form={form}
        onChange={onChange}
        generating={runningAction === "generate_keywords"}
        generateDisabled={Boolean(runningAction) || !aiReady}
        onGenerate={() => void runAction("generate_keywords")}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {AI_ACTIONS.map((item) => (
          <button
            key={item.action}
            type="button"
            disabled={Boolean(runningAction) || !aiReady}
            onClick={() => void runAction(item.action)}
            className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-40"
          >
            {runningAction === item.action ? (zh ? "生成中…" : "Running…") : zh ? item.zh : item.en}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-baseline gap-1">
          <span className="text-3xl font-semibold text-zinc-900">{score}</span>
          <span className="text-sm text-zinc-400">/ 100</span>
        </div>
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-100">
          <div className={cn("h-full rounded-full transition-all", progressTone)} style={{ width: `${Math.max(4, score)}%` }} />
        </div>
      </div>

      <p className="mb-3 break-words text-xs leading-relaxed text-zinc-400">
        {zh ? `基于当前表单实时计算 · Google ${metrics.googleScore} · 百度 ${metrics.baiduScore}` : `Live from current draft · Google ${metrics.googleScore} · Baidu ${metrics.baiduScore}`}
      </p>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="min-w-0 border-b border-zinc-50 pb-3 last:border-b-0 last:pb-0">
            <div className="flex items-start gap-2 text-sm">
              {item.status === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
              <span className={cn("min-w-0 font-medium", item.status === "ok" ? "text-zinc-700" : "text-amber-800")}>{item.label}</span>
            </div>
            <p className="mt-1 break-words pl-6 text-xs leading-relaxed text-zinc-500">{item.hint}</p>
          </li>
        ))}
      </ul>

      <Link href={adminPortalRoutes.knowledgeSeo} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700">
        <TrendingUp className="h-4 w-4 shrink-0" />
        <span>{zh ? "查看完整 SEO 分析" : "View full SEO analysis"}</span>
      </Link>
    </KnowledgeEditorCard>
  );
}
