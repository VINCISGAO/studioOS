"use client";

import Link from "next/link";
import { Plus, MessageSquareText } from "lucide-react";
import { BrandReviewClapperIllustration } from "@/components/studioos/brand-review-hub/brand-review-hub-art";
import { brandReviewHubText } from "@/components/studioos/brand-review-hub/brand-review-hub-copy";
import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { ReviewHubItem } from "@/lib/studioos/review-hub";
import { cn, formatDate } from "@/lib/utils";

export function BrandReviewHubContent({
  locale,
  items,
  filtered,
  showPublishCta
}: {
  locale: Locale;
  items: ReviewHubItem[];
  filtered: ReviewHubItem[];
  showPublishCta: boolean;
}) {
  const t = brandReviewHubText(locale);

  if (!filtered.length) {
    return (
      <section className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm">
        <div className="flex flex-col items-center px-6 py-14 text-center sm:py-16">
          <BrandReviewClapperIllustration className="h-24 w-32 sm:h-28 sm:w-36" />
          <p className="mt-5 text-base font-semibold text-zinc-900">{t.empty}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">{t.emptyBody}</p>
          {showPublishCta && !items.length ? (
            <BrandStartBriefButton
              locale={locale}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-violet-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
            >
              {t.publish}
              <Plus className="h-4 w-4" />
            </BrandStartBriefButton>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm">
      <ul className="divide-y divide-zinc-100">
        {filtered.map((item) => (
          <li
            key={item.orderId}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-900">{item.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-medium",
                    item.status === "review"
                      ? "bg-violet-50 text-violet-700"
                      : item.status === "revision"
                        ? "bg-amber-50 text-amber-700"
                        : item.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-600"
                  )}
                >
                  {t.status[item.status as keyof typeof t.status] ?? item.status}
                </span>
                <span>{t.versions(item.deliverableCount)}</span>
                {item.openCommentCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    {t.comments(item.openCommentCount)}
                  </span>
                ) : null}
                <span>{formatDate(item.updatedAt)}</span>
              </div>
            </div>
            <Button asChild size="sm" className="h-9 shrink-0 rounded-full bg-violet-600 px-4 hover:bg-violet-700">
              <Link href={withLocale(item.reviewHref, locale)}>{t.open}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
