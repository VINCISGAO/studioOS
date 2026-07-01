"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  brandCampaignStatusLabel,
  brandCampaignStepIndex
} from "@/lib/studioos/brand-campaign-display";
import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard";
import { brandProjectThumbnail } from "@/lib/studioos/brand-dashboard-display";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import { cn, formatDate } from "@/lib/utils";
import { ArrowRight, Calendar, CircleDollarSign } from "lucide-react";

const steps = {
  en: ["Brief", "Studio", "Pay", "Produce", "Review"],
  zh: ["需求", "选团队", "付款", "制作", "审片"]
};

function friendlyName(raw: string): string {
  if (raw.endsWith(" Campaign")) return raw.replace(/ Campaign$/, "");
  return raw;
}

function statusBadgeClass(normalized: string) {
  if (normalized === "payment_pending") return "border-amber-200 bg-amber-50 text-amber-800";
  if (normalized === "production") return "border-sky-200 bg-sky-50 text-sky-800";
  if (normalized === "in_review" || normalized === "delivered") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (normalized === "draft") return "border-zinc-200 bg-zinc-50 text-zinc-600";
  if (normalized === "matching") return "border-violet-200 bg-violet-50 text-violet-800";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

export function BrandCampaignListRow({
  locale,
  row,
  href,
  openLabel,
  thumbnailSlot,
  actionSlot
}: {
  locale: Locale;
  row: BrandProjectRow;
  href: string;
  openLabel: string;
  thumbnailSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
}) {
  const stepLabels = steps[locale];
  const normalized = normalizeCampaignStatus(row.status);
  const statusLabel = brandCampaignStatusLabel(row.status, locale);
  const stepIndex = brandCampaignStepIndex(row.status);
  const isPayCta = normalized === "payment_pending";

  return (
    <div className="flex gap-4 px-4 py-4 sm:px-5">
      {thumbnailSlot ?? (
        <div className="relative hidden h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 sm:block">
          <Image src={brandProjectThumbnail(row.id)} alt="" fill className="object-cover" sizes="80px" />
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {row.category ? (
                <Badge variant="secondary" className="rounded-full bg-zinc-100 font-normal text-zinc-600">
                  {row.category}
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full bg-zinc-100 font-normal text-zinc-600">
                  CPG
                </Badge>
              )}
              <Badge variant="outline" className={cn("rounded-full font-normal", statusBadgeClass(normalized))}>
                {statusLabel}
              </Badge>
            </div>
            <h3 className="mt-2 truncate text-base font-semibold tracking-tight text-zinc-900">
              {friendlyName(row.name)}
            </h3>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
              {row.budgetRange ? (
                <span className="inline-flex items-center gap-1">
                  <CircleDollarSign className="h-3.5 w-3.5" />
                  {row.budgetRange}
                </span>
              ) : null}
              {row.deadline ? (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {row.deadline}
                </span>
              ) : null}
              <span>{formatDate(row.updatedAt)}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {actionSlot}
            <Button
              asChild
              size="sm"
              className={cn(
                "h-9 rounded-xl px-4",
                isPayCta ? "bg-zinc-900 text-white hover:bg-zinc-800" : "border-zinc-200 bg-white text-zinc-900"
              )}
              variant={isPayCta ? "default" : "outline"}
            >
              <Link href={withLocale(href, locale)}>
                {row.cta || openLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {row.kind === "campaign" ? (
          <div>
            <div className="flex items-center">
              {stepLabels.map((label, index) => (
                <div key={label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold",
                        index <= stepIndex ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-400"
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className={cn("text-[10px]", index <= stepIndex ? "text-zinc-700" : "text-zinc-400")}>
                      {label}
                    </span>
                  </div>
                  {index < stepLabels.length - 1 ? (
                    <div
                      className={cn(
                        "mx-1 h-0.5 flex-1 rounded-full",
                        index < stepIndex ? "bg-violet-500" : "bg-zinc-200"
                      )}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
