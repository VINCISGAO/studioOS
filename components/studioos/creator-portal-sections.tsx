import Link from "next/link";
import { Clapperboard, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatorInvitationsPanel } from "@/components/studioos/creator-invitations-panel";
import { PageHeader } from "@/components/studioos/ui/page-header";
import type {
  CreatorPortalCampaignView,
  CreatorPortalInvitationView,
  CreatorPortalStats
} from "@/features/creator/creator-portal.types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import type { StoredOrder } from "@/lib/order-types";
import { formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    invitations: "Invitations",
    invitationsSub: "Accept new brand projects",
    campaigns: "Active campaigns",
    campaignsSub: "Prisma-backed production pipeline",
    orders: "Assigned orders",
    review: "Review",
    deliver: "Deliver",
    open: "Open",
    emptyCampaigns: "No active campaigns yet.",
    emptyOrders: "No assigned orders yet."
  },
  zh: {
    invitations: "项目邀请",
    invitationsSub: "接受新的品牌项目",
    campaigns: "进行中的 Campaign",
    campaignsSub: "数据库驱动的制作流程",
    orders: "分配订单",
    review: "审片",
    deliver: "交付",
    open: "打开",
    emptyCampaigns: "暂无进行中的 Campaign。",
    emptyOrders: "暂无分配订单。"
  }
};

export function CreatorPortalSections({
  locale,
  invitations,
  campaigns,
  orders,
  stats
}: {
  locale: Locale;
  invitations: CreatorPortalInvitationView[];
  campaigns: CreatorPortalCampaignView[];
  orders: StoredOrder[];
  stats: CreatorPortalStats;
}) {
  const t = copy[locale];

  return (
    <div className="space-y-6">
      {stats.pendingInvitations > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-indigo-200/70 bg-indigo-50/40 p-5 sm:p-6">
          <PageHeader
            title={t.invitations}
            description={`${stats.pendingInvitations} pending · ${t.invitationsSub}`}
          />
          <div className="mt-4">
            <CreatorInvitationsPanel locale={locale} invitations={invitations} compact />
          </div>
        </section>
      ) : null}

      {campaigns.length ? (
        <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
            <PageHeader title={t.campaigns} description={t.campaignsSub} />
          </div>
          <ul className="divide-y divide-zinc-100">
            {campaigns.map((campaign) => (
              <li key={campaign.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="font-medium text-zinc-900">{campaign.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {campaign.status} · {formatCurrency(campaign.budget, locale)} · R{campaign.reviewRound}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link href={withLocale(creatorPortalRoutes.campaignReview(campaign.legacyProjectId ?? campaign.id), locale)}>
                    <Clapperboard className="h-4 w-4" />
                    {t.review}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
          <PageHeader title={t.orders} description={`${orders.length} total`} />
        </div>
        {orders.length ? (
          <ul className="divide-y divide-zinc-100">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="font-medium text-zinc-900">{order.title || order.company_name}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {order.status} · {formatCurrency(order.creator_payout, locale)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link href={withLocale(creatorPortalRoutes.project(order.id), locale)}>{t.open}</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link href={withLocale(creatorPortalRoutes.review(order.id), locale)}>
                      <Clapperboard className="h-4 w-4" />
                      {t.review}
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                    <Link href={withLocale(creatorPortalRoutes.deliveryForOrder(order.id), locale)}>
                      <Upload className="h-4 w-4" />
                      {t.deliver}
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-10 text-center text-sm text-zinc-500">{t.emptyOrders}</p>
        )}
      </section>
    </div>
  );
}
