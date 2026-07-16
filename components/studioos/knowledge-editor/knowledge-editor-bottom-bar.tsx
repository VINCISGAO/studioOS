"use client";

import { PortalFixedFooter } from "@/components/studioos/portal/portal-fixed-footer";
import { knowledgeEditorPublishStatusLabel } from "@/lib/knowledge/knowledge-editor-copy";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { KnowledgeArticleStatus } from "@prisma/client";
import { ArrowRight, Save } from "lucide-react";

const actionBtn =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const STATUS_DOT_STYLES: Record<KnowledgeArticleStatus, string> = {
  DRAFT: "bg-emerald-500",
  REVIEW: "bg-amber-500",
  SCHEDULED: "bg-sky-500",
  PUBLISHED: "bg-violet-500",
  ARCHIVED: "bg-zinc-400"
};

type Props = {
  locale: Locale;
  charCount: number;
  displayStatus: KnowledgeArticleStatus;
  saveState: "idle" | "saving" | "saved";
  saving: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
};

export function KnowledgeEditorBottomBar({
  locale,
  charCount,
  displayStatus,
  saveState,
  saving,
  onSaveDraft,
  onPublish
}: Props) {
  const zh = locale === "zh";

  return (
    <PortalFixedFooter zIndex="z-40">
      <div className="mx-auto flex w-full max-w-[1480px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <span className="text-xs text-zinc-500">
          {zh ? "字符数" : "Chars"}: {charCount.toLocaleString()}
        </span>

        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT_STYLES[displayStatus])} />
          {knowledgeEditorPublishStatusLabel(displayStatus, zh)}
        </span>

        {saveState === "saving" ? <span className="text-xs text-zinc-500">{zh ? "保存中…" : "Saving…"}</span> : null}
        {saveState === "saved" ? <span className="text-xs text-emerald-600">{zh ? "已保存" : "Saved"}</span> : null}

        <div className="min-w-0 flex-1" />

        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          <button
            type="button"
            className={cn(actionBtn, "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50")}
            disabled={saving}
            onClick={onSaveDraft}
          >
            <Save className="h-4 w-4" />
            {zh ? "保存草稿" : "Save draft"}
          </button>
          <button
            type="button"
            className={cn(actionBtn, "bg-violet-600 text-white hover:bg-violet-700")}
            disabled={saving}
            onClick={onPublish}
          >
            {zh ? "发布文章" : "Publish"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </PortalFixedFooter>
  );
}
