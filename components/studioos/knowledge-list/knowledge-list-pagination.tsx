"use client";

import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  locale: Locale;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function KnowledgeListPagination({ locale, total, page, pageSize, onPageChange, onPageSizeChange }: Props) {
  const zh = locale === "zh";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-zinc-500">{zh ? `共 ${total} 条` : `${total} total`}</p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((item, index) =>
          item === "…" ? (
            <span key={`ellipsis-${index}`} className="px-1 text-zinc-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={cn(
                "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm",
                page === item
                  ? "border-violet-200 bg-violet-50 font-medium text-violet-700"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-2"
        >
          {[10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {zh ? `${size} 条/页` : `${size} / page`}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function buildPageList(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | "…"> = [1];
  if (current > 3) pages.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i += 1) pages.push(i);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}
