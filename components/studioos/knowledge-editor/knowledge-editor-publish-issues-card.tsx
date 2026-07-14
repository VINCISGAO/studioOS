"use client";

import type { Locale } from "@/lib/i18n";
import { CircleAlert } from "lucide-react";
import { KnowledgeEditorSidebarCard } from "@/components/studioos/knowledge-editor/knowledge-editor-sidebar-primitives";

function isRecommendedIssue(issue: string, zh: boolean) {
  return issue.includes(zh ? "建议" : "recommended");
}

export function KnowledgeEditorPublishIssuesCard({
  locale,
  issues
}: {
  locale: Locale;
  issues: string[];
}) {
  const zh = locale === "zh";
  if (!issues.length) return null;

  const required = issues.filter((item) => !isRecommendedIssue(item, zh));
  const recommended = issues.filter((item) => isRecommendedIssue(item, zh));

  return (
    <KnowledgeEditorSidebarCard
      tone="amber"
      title={zh ? "发布前检查" : "Pre-publish checklist"}
      description={zh ? "完成必填项后即可发布文章。" : "Complete required items before publishing."}
      badge={
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
          {required.length || issues.length}
        </span>
      }
    >
      <div className="space-y-4">
        {required.length ? (
          <IssueGroup
            title={zh ? "必须完成" : "Required"}
            issues={required}
            tone="required"
          />
        ) : null}
        {recommended.length ? (
          <IssueGroup
            title={zh ? "建议优化" : "Recommended"}
            issues={recommended}
            tone="recommended"
          />
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
              className={tone === "required" ? "mt-0.5 h-4 w-4 shrink-0 text-rose-500" : "mt-0.5 h-4 w-4 shrink-0 text-amber-500"}
            />
            <span>{issue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
