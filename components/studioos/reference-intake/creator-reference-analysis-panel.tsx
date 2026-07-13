"use client";

import type { StoredProjectReference } from "@/lib/campaign-types";
import { ReferenceAnalysisCard } from "@/components/studioos/reference-intake/reference-analysis-card";
import type { Locale } from "@/lib/i18n";

export function CreatorReferenceAnalysisPanel({
  locale,
  references
}: {
  locale: Locale;
  references: StoredProjectReference[];
}) {
  const zh = locale === "zh";
  if (!references.length) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-violet-100 bg-violet-50/20 p-4">
      <div>
        <p className="text-sm font-semibold text-violet-900">
          {zh ? "品牌参考内容（AI 已解析）" : "Brand references (AI analyzed)"}
        </p>
        <p className="mt-1 text-xs leading-5 text-violet-800/80">
          {zh
            ? "无需依赖原始链接。优先阅读 AI 风格摘要、镜头拆解与可复制要点。"
            : "No need to rely on original links. Read the AI style summary, shot breakdown, and copyable cues first."}
        </p>
      </div>
      {references.map((reference) => (
        <ReferenceAnalysisCard key={reference.id} locale={locale} reference={reference} variant="creator" />
      ))}
    </div>
  );
}
