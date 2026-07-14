"use client";

import { knowledgeEditorPublishStatusLabel } from "@/lib/knowledge/knowledge-editor-copy";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { KnowledgeArticleStatus } from "@prisma/client";
import { ArrowRight, ChevronRight, Save } from "lucide-react";
import Link from "next/link";

const STATUS_BADGE_STYLES: Record<KnowledgeArticleStatus, string> = {
  DRAFT: "bg-emerald-50 text-emerald-700",
  REVIEW: "bg-amber-50 text-amber-800",
  SCHEDULED: "bg-sky-50 text-sky-800",
  PUBLISHED: "bg-violet-50 text-violet-800",
  ARCHIVED: "bg-zinc-100 text-zinc-600"
};

const STATUS_DOT_STYLES: Record<KnowledgeArticleStatus, string> = {
  DRAFT: "bg-emerald-500",
  REVIEW: "bg-amber-500",
  SCHEDULED: "bg-sky-500",
  PUBLISHED: "bg-violet-500",
  ARCHIVED: "bg-zinc-400"
};

const actionBtn =
  "relative z-10 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export function KnowledgeEditorTopBar({
  locale,
  isNew,
  displayStatus,
  saveState,
  saving,
  onSaveDraft,
  onPublish
}: {
  locale: Locale;
  isNew: boolean;
  displayStatus: KnowledgeArticleStatus;
  saveState: "idle" | "saving" | "saved";
  saving: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
}) {
  const zh = locale === "zh";

  return (
    <div className="relative z-50 mb-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
      <nav className="flex min-w-0 items-center gap-1 text-sm text-zinc-500">
        <Link href={adminPortalRoutes.knowledge} className="hover:text-violet-600">
          {zh ? "知识中心" : "Knowledge"}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" />
        <span className="truncate font-medium text-zinc-800">
          {isNew ? (zh ? "创建文章" : "New article") : zh ? "编辑文章" : "Edit article"}
        </span>
      </nav>

      <div className="hidden h-5 w-px bg-zinc-200 sm:block" />

      <div className="flex w-full flex-wrap items-center gap-2 text-xs text-zinc-500 sm:w-auto">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium", STATUS_BADGE_STYLES[displayStatus])}>
          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT_STYLES[displayStatus])} />
          {knowledgeEditorPublishStatusLabel(displayStatus, zh)}
        </span>
        {saveState === "saving" ? <span>{zh ? "保存中…" : "Saving…"}</span> : null}
        {saveState === "saved" ? <span className="text-emerald-600">{zh ? "已保存" : "Saved"}</span> : null}
      </div>

      <div className="hidden flex-1 sm:block" />

      <div className="relative z-10 flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
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
  );
}
