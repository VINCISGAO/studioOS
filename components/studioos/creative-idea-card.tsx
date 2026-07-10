"use client";

import { Badge } from "@/components/ui/badge";
import type { CollaborationIdea } from "@/features/creative-collaboration/creative-collaboration.types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function CreativeIdeaCard({
  locale,
  idea,
  selected,
  onSelect,
  children
}: {
  locale: Locale;
  idea: CollaborationIdea;
  selected?: boolean;
  onSelect?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition",
        selected ? "border-violet-300 bg-violet-50/60" : "border-zinc-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-zinc-900">{idea.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">{idea.summary}</p>
        </div>
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            className={cn(
              "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium",
              selected
                ? "border-violet-500 bg-violet-600 text-white"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
            )}
          >
            {selected
              ? locale === "zh"
                ? "已选"
                : "Selected"
              : locale === "zh"
                ? "选择"
                : "Select"}
          </button>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline" className="font-normal">
          {idea.actor === "brand"
            ? locale === "zh"
              ? "品牌方向"
              : "Brand draft"
            : locale === "zh"
              ? "创作者方向"
              : "Creator draft"}
        </Badge>
        {idea.status !== "draft" ? (
          <Badge variant="secondary" className="font-normal capitalize">
            {idea.status}
          </Badge>
        ) : null}
      </div>
      {children}
    </div>
  );
}
