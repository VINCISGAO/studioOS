"use client";

import { knowledgeEditorCategoryLabel } from "@/lib/knowledge/knowledge-editor-copy";
import { knowledgeAdminLanguageLabel } from "@/lib/knowledge/knowledge-admin-translation";
import { cn } from "@/lib/utils";

const CATEGORY_STYLES: Record<string, string> = {
  "AI Advertising": "bg-violet-50 text-violet-700",
  "AI Video": "bg-sky-50 text-sky-700",
  "Brand Marketing": "bg-orange-50 text-orange-700",
  "Creative Strategy": "bg-fuchsia-50 text-fuchsia-700"
};

export function knowledgeListCategoryClass(name: string) {
  return CATEGORY_STYLES[name] ?? "bg-zinc-100 text-zinc-700";
}

export function KnowledgeListCategoryBadge({
  categorySlug,
  categoryName,
  zh
}: {
  categorySlug?: string | null;
  categoryName?: string | null;
  zh: boolean;
}) {
  const label = categorySlug ? knowledgeEditorCategoryLabel(categorySlug, zh) : categoryName || "—";
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        knowledgeListCategoryClass(categoryName ?? "")
      )}
    >
      {label}
    </span>
  );
}

export function KnowledgeListStatusBadge({ status, zh }: { status: string; zh: boolean }) {
  if (status === "PUBLISHED") {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {zh ? "已发布" : "Published"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
      <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
      {zh ? "草稿" : "Draft"}
    </span>
  );
}

export function knowledgeListLanguageLabel(code: string, zh: boolean) {
  return knowledgeAdminLanguageLabel(code, zh);
}

export function formatKnowledgeListUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
