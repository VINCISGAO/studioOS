import Link from "next/link";
import { Clapperboard, Receipt, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/studioos/ui/page-header";
import type {
  BrandPortalCampaignView,
  BrandPortalEscrowView,
  BrandPortalStats
} from "@/features/brand/brand-portal.types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    review: "Ready to review",
    reviewSub: "Open review room for feedback and approval",
    settlement: "Escrow & settlement",
    settlementSub: "Track held funds and release after approval",
    openReview: "Review",
    openCheckout: "Pay / checkout",
    openProject: "Open project",
    held: "Held in escrow",
    released: "Released",
    emptyReview: "No campaigns awaiting review.",
    emptySettlement: "No escrow records yet."
  },
  zh: {
    review: "待审片",
    reviewSub: "进入审片室反馈与批准",
    settlement: "托管与结算",
    settlementSub: "查看托管资金，批准后释放",
    openReview: "审片",
    openCheckout: "付款",
    openProject: "打开项目",
    held: "托管中",
    released: "已释放",
    emptyReview: "暂无待审片项目。",
    emptySettlement: "暂无托管记录。"
  }
};

export function BrandPortalSections({
  locale,
  campaigns,
  escrows,
  stats
}: {
  locale: Locale;
  campaigns: BrandPortalCampaignView[];
  escrows: BrandPortalEscrowView[];
  stats: BrandPortalStats;
}) {
  const t = copy[locale];
  const reviewItems = campaigns.filter((c) =>
    ["UNDER_REVIEW", "APPROVED", "MASTER_UPLOADED", "SETTLEMENT"].includes(c.status)
  );
  const heldEscrows = escrows.filter((e) => e.status === "HELD" || e.status === "PARTIAL_RELEASE");

  if (!reviewItems.length && !heldEscrows.length) return null;

  return (
    <div className="space-y-6">
      {stats.awaitingReview > 0 && reviewItems.length ? (
        <section className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-5 sm:p-6">
          <PageHeader title={t.review} description={t.reviewSub} />
          <ul className="mt-4 space-y-3">
            {reviewItems.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-white/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-900">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {item.status} · R{item.reviewRound}
                  </p>
                </div>
                <Button asChild size="sm" className="rounded-xl bg-emerald-700 hover:bg-emerald-800">
                  <Link href={withLocale(brandPortalRoutes.projectReview(item.legacyProjectId ?? item.id), locale)}>
                    <Clapperboard className="h-4 w-4" />
                    {t.openReview}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {heldEscrows.length ? (
        <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
            <PageHeader title={t.settlement} description={t.settlementSub} />
          </div>
          <ul className="divide-y divide-zinc-100">
            {heldEscrows.slice(0, 5).map((item) => (
              <li
                key={item.campaignId}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <Wallet className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-zinc-900">{item.campaignTitle}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {t.held}: {formatCurrency(item.remainingAmount)} {item.currency} · {item.status}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link href={withLocale(brandPortalRoutes.settlement, locale)}>
                    <Receipt className="h-4 w-4" />
                    {t.released}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
