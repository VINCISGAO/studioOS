"use client";

import {
  KnowledgeEditorField,
  KnowledgeEditorFieldStack,
  KnowledgeEditorSidebarCard,
  KnowledgeEditorStatusBadge
} from "@/components/studioos/knowledge-editor/knowledge-editor-sidebar-primitives";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function KnowledgeEditorLucienCard({
  locale,
  aiSummary,
  aiKeywords,
  synced,
  disabled,
  onGenerate,
  onSync
}: {
  locale: Locale;
  aiSummary: string;
  aiKeywords: string;
  synced: boolean;
  disabled?: boolean;
  onGenerate: () => void;
  onSync: () => void;
}) {
  const zh = locale === "zh";

  return (
    <KnowledgeEditorSidebarCard
      tone="violet"
      title={zh ? "Lucien 知识库" : "Lucien Knowledge"}
      description={zh ? "标准知识索引，仅同步英文源稿。" : "Canonical knowledge index for the English source draft."}
      badge={<KnowledgeEditorStatusBadge label={zh ? "未同步" : "Not synced"} active={synced} locale={locale} />}
    >
      <KnowledgeEditorFieldStack>
        <KnowledgeEditorField label={zh ? "AI 摘要" : "AI Summary"}>
          <Textarea
            readOnly
            rows={3}
            value={aiSummary}
            className="resize-none bg-white text-sm"
            placeholder={zh ? "点击「生成」自动创建" : "Click Generate to auto-create"}
          />
        </KnowledgeEditorField>
        <KnowledgeEditorField label={zh ? "知识关键词" : "Knowledge Keywords"}>
          <Textarea
            readOnly
            rows={2}
            value={aiKeywords}
            className="resize-none bg-white text-sm"
            placeholder={zh ? "点击「生成」自动创建" : "Click Generate to auto-create"}
          />
        </KnowledgeEditorField>
      </KnowledgeEditorFieldStack>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" className="h-10" disabled={disabled} onClick={onGenerate}>
          {zh ? "生成" : "Generate"}
        </Button>
        <Button type="button" className="h-10 bg-[#5B5CEB] hover:bg-[#4b4cdb]" disabled={disabled} onClick={onSync}>
          {zh ? "同步" : "Sync"}
        </Button>
      </div>
      {disabled ? (
        <p className="mt-3 text-[11px] leading-5 text-violet-700/80">
          {zh ? "保存文章后可同步到 Lucien。" : "Save the article before syncing to Lucien."}
        </p>
      ) : null}
    </KnowledgeEditorSidebarCard>
  );
}
