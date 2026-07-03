import type { Locale } from "@/lib/i18n";
import { getReviewerSkeletonMock } from "@/components/studioos/reviewer-skeleton/reviewer-skeleton-mock";
import { ReviewerSkeletonHeader } from "@/components/studioos/reviewer-skeleton/reviewer-shell-header";
import { ReviewerSkeletonToolbar } from "@/components/studioos/reviewer-skeleton/reviewer-skeleton-toolbar";
import { ReviewerSkeletonPlayer } from "@/components/studioos/reviewer-skeleton/reviewer-skeleton-player";
import { ReviewerSkeletonTimeline } from "@/components/studioos/reviewer-skeleton/reviewer-skeleton-timeline";
import { ReviewerSkeletonCommentsPanel } from "@/components/studioos/reviewer-skeleton/reviewer-skeleton-comments";
import { ReviewerSkeletonVersions } from "@/components/studioos/reviewer-skeleton/reviewer-skeleton-versions";

export function ReviewerSkeletonLayout({
  locale,
  backHref,
  backLabel
}: {
  locale: Locale;
  backHref: string;
  backLabel?: string;
}) {
  const mock = getReviewerSkeletonMock(locale);

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100svh-4rem)] bg-zinc-50 lg:-mx-8">
      <ReviewerSkeletonHeader locale={locale} backHref={backHref} backLabel={backLabel} mock={mock} />
      <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[auto_minmax(0,1fr)_360px]">
        <ReviewerSkeletonToolbar locale={locale} />
        <div className="space-y-4">
          <ReviewerSkeletonPlayer locale={locale} mock={mock} />
          <ReviewerSkeletonTimeline locale={locale} mock={mock} />
          <ReviewerSkeletonVersions locale={locale} mock={mock} />
        </div>
        <ReviewerSkeletonCommentsPanel locale={locale} mock={mock} />
      </div>
    </div>
  );
}
