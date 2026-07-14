"use client";

import type { Locale } from "@/lib/i18n";
import { CircleAlert } from "lucide-react";
import { KnowledgeEditorSidebarCard } from "@/components/studioos/knowledge-editor/knowledge-editor-sidebar-primitives";

export function KnowledgeEditorPublishIssuesCard({
  locale,
  blockers,
  warnings
}: {
  locale: Locale;
  blockers: string[];
  warnings: string[];
}) {
  const zh = locale === "zh";
  if (!blockers.length && !warnings.length) return null;

  return (
    <KnowledgeEditorSidebarCard
      tone="amber"
      title={zh ? "发布前检查" : "Pre-publish checklist"}
      description={
        blockers.length
          ? zh
            ? "完成必填项后即可发布文章。"
            : "Complete required items before publishing."
          : zh
            ? "必填项已完成，可直接发布。"
            : "Required items are complete — you can publish."
      }
      badge={
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
          {blockers.length || warnings.length}
        </span>
      }
    >
      <div className="space-y-4">
        {blockers.length ? (
          <IssueGroup title={zh ? "必须完成" : "Required"} issues={blockers} tone="required" />
        ) : null}
        {warnings.length ? (
          <IssueGroup title={zh ? "建议优化" : "Recommended"} issues={warnings} tone="recommended" />
        ) : null}
      </div>
    </KnowledgeEditorSidebarCard>
  );
}

function IssueGroup({
  title,
  issues,
  tone
}: {
  title: string;
  issues: string[];
  tone: "required" | "recommended";
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800/80">{title}</p>
      <ul className="mt-2 space-y-2">
        {issues.map((issue) => (
          <li
            key={issue}
            className="flex items-start gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm leading-5 text-amber-950"
          >
            <CircleAlert
              className={
                tone === "required"
                  ? "mt-0.5 h-4 w-4 shrink-0 text-rose-500"
                  : "mt-0.5 h-4 w-4 shrink-0 text-amber-500"
              }
            />
            <span>{issue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
