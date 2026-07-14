"use client";

import type { KnowledgeAiAssistantAction } from "@/features/knowledge-center/knowledge-ai-assistant.types";
import {
  KnowledgeEditorSidebarCard
} from "@/components/studioos/knowledge-editor/knowledge-editor-sidebar-primitives";
import type { Locale } from "@/lib/i18n";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const AI_GROUPS: Array<{
  id: string;
  titleZh: string;
  titleEn: string;
  actions: KnowledgeAiAssistantAction[];
}> = [
  {
    id: "seo",
    titleZh: "SEO",
    titleEn: "SEO",
    actions: ["generate_seo_title", "generate_meta_description", "generate_summary", "generate_keywords", "generate_faq"]
  },
  {
    id: "content",
    titleZh: "正文",
    titleEn: "Content",
    actions: ["improve_writing", "suggest_internal_links"]
  },
  {
    id: "lucien",
    titleZh: "Lucien",
    titleEn: "Lucien",
    actions: ["generate_lucien_summary"]
  }
];

const ACTION_LABELS: Record<KnowledgeAiAssistantAction, { en: string; zh: string }> = {
  generate_seo_title: { en: "SEO title", zh: "SEO 标题" },
  generate_meta_description: { en: "Meta description", zh: "页面描述" },
  generate_summary: { en: "Summary", zh: "文章摘要" },
  generate_keywords: { en: "Keywords", zh: "核心关键词" },
  generate_faq: { en: "FAQ", zh: "常见问题" },
  improve_writing: { en: "Improve writing", zh: "润色正文" },
  suggest_internal_links: { en: "Internal links", zh: "内链建议" },
  generate_lucien_summary: { en: "Lucien summary", zh: "Lucien 摘要" }
};

export function KnowledgeEditorAiCard({
  locale,
  disabled,
  runningAction,
  onAction
}: {
  locale: Locale;
  disabled?: boolean;
  runningAction?: KnowledgeAiAssistantAction | null;
  onAction: (action: KnowledgeAiAssistantAction) => void;
}) {
  const zh = locale === "zh";

  return (
    <KnowledgeEditorSidebarCard
      title={zh ? "AI 助手" : "AI Assistant"}
      description={
        zh ? "基于当前英文正文生成 SEO、正文与 Lucien 字段。" : "Generate SEO, content, and Lucien fields from the English draft."
      }
      badge={<Sparkles className="h-4 w-4 text-[#5B5CEB]" />}
    >
      <div className="space-y-4">
        {AI_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
              {zh ? group.titleZh : group.titleEn}
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {group.actions.map((action) => {
                const running = runningAction === action;
                return (
                  <button
                    key={action}
                    type="button"
                    disabled={disabled || running}
                    onClick={() => onAction(action)}
                    className={cn(
                      "flex h-10 items-center justify-between rounded-xl border px-3 text-left text-sm transition",
                      "border-zinc-200 bg-white text-zinc-700 hover:border-violet-200 hover:bg-violet-50/50 hover:text-[#5B5CEB]",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    <span>{zh ? ACTION_LABELS[action].zh : ACTION_LABELS[action].en}</span>
                    {running ? <Loader2 className="h-4 w-4 animate-spin text-[#5B5CEB]" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </KnowledgeEditorSidebarCard>
  );
}
