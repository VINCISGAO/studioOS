"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { getReviewerV1Copy } from "@/components/studioos/reviewer-v1/reviewer-v1-copy";

export function ReviewerV1Header({
  locale,
  backHref,
  backLabel,
  campaignTitle,
  orderId,
  createdAt,
  metadata,
  decisionSlot
}: {
  locale: Locale;
  backHref: string;
  backLabel?: string;
  campaignTitle: string;
  orderId: string;
  createdAt?: string;
  metadata?: string;
  decisionSlot?: ReactNode;
}) {
  const t = getReviewerV1Copy(locale);
  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-start gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel ?? t.back}
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-zinc-950">{campaignTitle}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>{orderId}</span>
            {createdAt ? <span>{formatDate(createdAt)}</span> : null}
            {metadata ? <span>{metadata}</span> : null}
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
              {t.reviewPending}
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" disabled>
            {t.download}
          </Button>
          <Button size="sm" variant="outline" disabled>
            {t.compare}
          </Button>
          {decisionSlot}
        </div>
      </div>
    </header>
  );
}
