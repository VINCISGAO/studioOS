"use client";

import { KnowledgeEditorCard } from "@/components/studioos/knowledge-editor/knowledge-editor-ui-primitives";
import { adminMutationHeaders } from "@/lib/studioos/admin-csrf-client";
import type { Locale } from "@/lib/i18n";
import { Sparkles } from "lucide-react";
import { useState } from "react";

type Props = {
  locale: Locale;
  articleId?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  onNotify: (message: string, variant: "success" | "error" | "info", detail?: string) => void;
};

export function KnowledgeEditorLucienPanel({ locale, articleId, value, onChange, onNotify }: Props) {
  const zh = locale === "zh";
  const [syncing, setSyncing] = useState(false);

  async function syncLucien() {
    if (!articleId) {
      onNotify(zh ? "请先保存文章再同步 Lucien" : "Save the article before syncing Lucien", "error");
      return;
    }
    setSyncing(true);
    try {
      const response = await fetch(`/api/admin/knowledge/${articleId}/sync-lucien`, {
        method: "POST",
        headers: adminMutationHeaders(),
        credentials: "same-origin"
      });
      const body = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? (zh ? "同步失败" : "Sync failed"));
      onNotify(zh ? "Lucien 已同步" : "Lucien synced", "success");
    } catch (error) {
      const text = error instanceof Error ? error.message : zh ? "同步失败" : "Sync failed";
      onNotify(zh ? "Lucien 同步失败" : "Lucien sync failed", "error", text);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <KnowledgeEditorCard title={zh ? "Lucien 学习" : "Lucien learning"}>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3">
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-violet-300 text-violet-600"
        />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-sm font-medium text-violet-900">
            <Sparkles className="h-4 w-4" />
            {zh ? "允许 Lucien 学习本文" : "Allow Lucien to learn from this article"}
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-violet-800/80">
            {zh ? "开启后，发布时会把本文摘要与关键词同步到 Lucien 知识库。" : "When enabled, publish syncs summary and keywords into Lucien."}
          </span>
        </span>
      </label>
      <button
        type="button"
        disabled={syncing || !articleId}
        onClick={() => void syncLucien()}
        className="mt-3 w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-40"
      >
        {syncing ? (zh ? "同步中…" : "Syncing…") : zh ? "同步 Lucien" : "Sync Lucien"}
      </button>
    </KnowledgeEditorCard>
  );
}
