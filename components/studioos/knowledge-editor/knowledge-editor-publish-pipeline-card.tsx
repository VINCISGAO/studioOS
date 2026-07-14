"use client";

import { KNOWLEDGE_PUBLISH_STEP_LABELS, KNOWLEDGE_PUBLISH_STEPS } from "@/features/knowledge-center/knowledge-publish.pipeline.shared";
import { KnowledgeEditorSidebarCard } from "@/components/studioos/knowledge-editor/knowledge-editor-sidebar-primitives";
import type { Locale } from "@/lib/i18n";
import { Workflow } from "lucide-react";

export function KnowledgeEditorPublishPipelineCard({ locale }: { locale: Locale }) {
  const zh = locale === "zh";

  return (
    <KnowledgeEditorSidebarCard
      tone="emerald"
      title={zh ? "一键发布管线" : "One-click publish pipeline"}
      description={
        zh ? "点击「发布文章」后，以下步骤将自动完成。" : "Click Publish and VINCIS runs every step automatically."
      }
      badge={<Workflow className="h-4 w-4 text-emerald-600" />}
    >
      <ul className="max-h-48 space-y-2 overflow-auto pr-1 text-sm leading-5 text-emerald-950">
        {KNOWLEDGE_PUBLISH_STEPS.map((step) => (
          <li key={step} className="flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2">
            <span className="mt-0.5 text-emerald-600">✓</span>
            <span>{KNOWLEDGE_PUBLISH_STEP_LABELS[step][zh ? "zh" : "en"]}</span>
          </li>
        ))}
      </ul>
    </KnowledgeEditorSidebarCard>
  );
}
