import Link from "next/link";
import { Clapperboard, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { ReviewHubItem } from "@/lib/studioos/review-hub";
import { cn, formatDate } from "@/lib/utils";

const copy = {
  en: {
    open: "Open review",
    empty: "No projects in review yet.",
    emptyBody: "When a studio uploads a review version, it will appear here.",
    openComments: (count: number) => `${count} open comments`,
    versions: (count: number) => `${count} version${count === 1 ? "" : "s"}`
  },
  zh: {
    open: "进入审片",
    empty: "暂无审片项目。",
    emptyBody: "制作团队上传审片版后，会出现在这里。",
    openComments: (count: number) => `${count} 条未解决批注`,
    versions: (count: number) => `${count} 个版本`
  }
};

const statusLabel = {
  en: {
    in_production: "Awaiting upload",
    review: "Pending review",
    revision: "Revision requested",
    completed: "Completed"
  },
  zh: {
    in_production: "待上传",
    review: "待审核",
    revision: "待修改",
    completed: "已完成"
  }
};

export function ReviewHubList({
  locale,
  items,
  audience = "brand"
}: {
  locale: Locale;
  items: ReviewHubItem[];
  audience?: "brand" | "creator";
}) {
  const t = copy[locale];
  const emptyBody =
    audience === "creator"
      ? locale === "zh"
        ? "选中并开始制作后，在审片中心上传 Version 1。"
        : "After production starts, upload Version 1 from the review center."
      : t.emptyBody;

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-white px-6 py-16 text-center shadow-sm">
        <Clapperboard className="mx-auto h-8 w-8 text-zinc-300" />
        <p className="mt-3 text-sm font-medium text-zinc-700">{t.empty}</p>
        <p className="mt-1 text-sm text-zinc-500">{emptyBody}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      {items.map((item) => (
        <li
          key={item.orderId}
          className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900">{item.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-medium",
                  item.status === "review"
                    ? "bg-blue-50 text-blue-700"
                    : item.status === "revision"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-zinc-100 text-zinc-600"
                )}
              >
                {statusLabel[locale][item.status as keyof typeof statusLabel.en] ?? item.status}
              </span>
              <span>{t.versions(item.deliverableCount)}</span>
              {item.openCommentCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  {t.openComments(item.openCommentCount)}
                </span>
              ) : null}
              <span>{formatDate(item.updatedAt)}</span>
            </div>
          </div>
          <Button asChild size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700">
            <Link href={withLocale(item.reviewHref, locale)}>
              <Clapperboard className="h-4 w-4" />
              {t.open}
            </Link>
          </Button>
        </li>
      ))}
    </ul>
  );
}
