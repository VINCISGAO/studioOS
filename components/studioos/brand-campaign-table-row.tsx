"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { brandCampaignStatusLabel } from "@/lib/studioos/brand-campaign-display";
import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard-types";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import { cn, formatDate } from "@/lib/utils";

const copy = {
  en: {
    teamPlaceholder: "—",
    open: "Continue",
    delete: "Delete"
  },
  zh: {
    teamPlaceholder: "—",
    open: "继续",
    delete: "删除"
  }
} as const;

function friendlyName(raw: string): string {
  if (raw.endsWith(" Campaign")) return raw.replace(/ Campaign$/, "");
  return raw;
}

function statusBadgeClass(normalized: string) {
  if (normalized === "payment_expired" || normalized === "payment_pending") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (normalized === "production") return "border-sky-200 bg-sky-50 text-sky-800";
  if (normalized === "in_review" || normalized === "delivered") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (normalized === "draft") return "border-zinc-200 bg-zinc-50 text-zinc-600";
  if (normalized === "matching") return "border-violet-200 bg-violet-50 text-violet-800";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

export function BrandCampaignTableRow({
  locale,
  row,
  href,
  checked,
  selectable,
  onToggle,
  onDelete,
  isPending
}: {
  locale: Locale;
  row: BrandProjectRow;
  href: string;
  checked: boolean;
  selectable: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const t = copy[locale];
  const normalized = normalizeCampaignStatus(row.status);
  const statusKey = row.paymentExpired ? "payment_expired" : normalized;
  const statusLabel = row.paymentExpired
    ? locale === "zh"
      ? "已超时"
      : "Expired"
    : brandCampaignStatusLabel(row.status, locale);

  return (
    <tr className={cn("border-b border-zinc-100 transition", checked ? "bg-zinc-50" : "hover:bg-zinc-50/70")}>
      <td className="w-10 px-3 py-3.5 sm:px-4">
        {selectable ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={onToggle}
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded border transition",
              checked ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white hover:border-zinc-400"
            )}
          >
            {checked ? (
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 6l3 3 5-5" />
              </svg>
            ) : null}
          </button>
        ) : (
          <span className="block h-4 w-4 rounded border border-zinc-200 bg-zinc-50" aria-hidden />
        )}
      </td>
      <td className="min-w-[140px] px-3 py-3.5 sm:px-4">
        <Link
          href={withLocale(href, locale)}
          className="line-clamp-2 text-sm font-medium text-zinc-900 hover:text-violet-700"
        >
          {friendlyName(row.name)}
        </Link>
      </td>
      <td className="hidden px-3 py-3.5 sm:table-cell sm:px-4">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
            statusBadgeClass(statusKey)
          )}
        >
          {statusLabel}
        </span>
      </td>
      <td className="hidden px-3 py-3.5 text-sm text-zinc-600 md:table-cell md:px-4">
        {row.budgetRange || "—"}
      </td>
      <td className="hidden px-3 py-3.5 text-sm text-zinc-500 lg:table-cell lg:px-4">{t.teamPlaceholder}</td>
      <td className="hidden px-3 py-3.5 text-sm tabular-nums text-zinc-500 sm:table-cell sm:px-4">
        {formatDate(row.updatedAt)}
      </td>
      <td className="px-3 py-3.5 sm:px-4">
        <div className="flex items-center justify-end gap-2">
          {selectable ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden h-8 rounded-lg border-red-200 bg-red-50 px-2.5 text-red-600 hover:border-red-300 hover:bg-red-100 sm:inline-flex"
              disabled={isPending}
              onClick={onDelete}
              aria-label={t.delete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline" className="h-8 rounded-lg px-3 text-xs sm:text-sm">
            <Link href={withLocale(href, locale)} prefetch>
              {row.cta || t.open}
            </Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}

export const brandCampaignTableHeaders = {
  en: {
    name: "Brief name",
    status: "Status",
    budget: "Budget",
    team: "Team",
    updated: "Updated",
    action: "Action"
  },
  zh: {
    name: "需求名称",
    status: "状态",
    budget: "预算范围",
    team: "团队",
    updated: "更新时间",
    action: "操作"
  }
} as const;
