import Link from "next/link";
import { Clapperboard } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { mobileTouch } from "@/lib/mobile/portal-compat";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

const copy = {
  en: {
    congrats: "Congratulations! You were selected by the brand — your official project is ready. Review center and delivery are now open.",
    production:
      "Official project is live. Confirm the creative direction first, then go to the review center to upload V1.",
    uploadV1: "Go to review center to upload Version 1"
  },
  zh: {
    congrats: "恭喜！你已被品牌选中，正式项目已生成。审片中心与交付流程现已开启。",
    production: "正式项目已开启。请先确认创意方向，再前往审片中心上传 V1。",
    uploadV1: "前往审片中心上传 Version 1"
  }
};

export function CreatorProjectSuccessBanner({
  locale,
  orderId,
  showUploadCta,
  showCongrats
}: {
  locale: Locale;
  orderId: string;
  showUploadCta: boolean;
  showCongrats: boolean;
}) {
  const t = copy[locale];
  const reviewHref = withLocale(creatorPortalRoutes.review(orderId), locale);

  if (!showCongrats && !showUploadCta) return null;

  return (
    <div className="space-y-3">
      {showCongrats ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-5 py-4">
          <p className="text-sm font-medium leading-relaxed text-emerald-950">{t.congrats}</p>
          <span className="hidden shrink-0 text-3xl leading-none sm:block" role="img" aria-label="Celebration">
            🎉
          </span>
        </div>
      ) : null}

      {showUploadCta ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4">
          <p className="text-sm text-emerald-950">{t.production}</p>
          <Link
            href={reviewHref}
            className={`mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-700 text-sm font-medium text-white transition hover:bg-emerald-800 ${mobileTouch.cta}`}
          >
            <Clapperboard className="h-4 w-4" />
            {t.uploadV1}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
