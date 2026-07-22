"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

export function CanvasInsufficientCreditsBanner({
  locale,
  tokenBalance,
  credits
}: {
  locale: Locale;
  tokenBalance: number;
  credits: number;
}) {
  const zh = locale === "zh";
  const creditsHref = withLocale(creatorPortalRoutes.credits, locale);

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2.5 text-[11px] leading-5 text-amber-900">
      <p>
        {zh
          ? `本次需要 ${credits} Credits，当前可用 ${tokenBalance} Credits。`
          : `This generation needs ${credits} credits. You have ${tokenBalance} available.`}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href={creditsHref}
          className="rounded-lg bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white"
        >
          {zh ? "立即购买" : "Buy credits"}
        </Link>
        <Link
          href={`${creditsHref}#convert`}
          className="rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-medium text-amber-900"
        >
          {zh ? "使用收益兑换" : "Convert earnings"}
        </Link>
      </div>
    </div>
  );
}
