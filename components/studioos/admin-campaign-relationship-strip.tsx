import Link from "next/link";
import { ArrowRight, Building2, Clapperboard, CreditCard, Truck, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminCampaignDetail } from "@/features/admin/campaign/admin-campaign.types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  adminDeliveryStatusLabel,
  adminEscrowStatusLabel,
  adminSettlementStateLabel
} from "@/lib/studioos/admin-enum-labels";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Binding chain",
    brand: "Brand",
    campaign: "Campaign",
    creator: "Creator",
    escrow: "Escrow",
    delivery: "Delivery",
    settlement: "Settlement"
  },
  zh: {
    title: "绑定链路",
    brand: "品牌方",
    campaign: "活动",
    creator: "创作者",
    escrow: "托管",
    delivery: "交付",
    settlement: "结算"
  }
} as const;

function ChainNode({
  icon: Icon,
  label,
  value,
  href,
  locale,
  active = true
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  href?: string;
  locale: Locale;
  active?: boolean;
}) {
  const content = (
    <div
      className={cn(
        "min-w-[132px] rounded-xl border px-3 py-3 transition",
        active ? "border-violet-200 bg-violet-50/50" : "border-zinc-200 bg-zinc-50 text-zinc-400"
      )}
    >
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-medium text-zinc-950">{value}</p>
    </div>
  );

  if (!href || !active) return content;
  return (
    <Link href={withLocale(href, locale)} className="block hover:opacity-90">
      {content}
    </Link>
  );
}

export function AdminCampaignRelationshipStrip({
  locale,
  detail
}: {
  locale: Locale;
  detail: AdminCampaignDetail;
}) {
  const t = copy[locale];

  return (
    <Card className="border-violet-200/60 bg-gradient-to-r from-violet-50/40 via-white to-white shadow-none">
      <CardContent className="p-5">
        <p className="text-sm font-semibold text-zinc-950">{t.title}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ChainNode
            icon={Building2}
            label={t.brand}
            value={detail.brand.name ?? detail.brand.email ?? "—"}
            href={adminPortalRoutes.brands}
            locale={locale}
          />
          <ArrowRight className="h-4 w-4 text-zinc-300" />
          <ChainNode
            icon={Clapperboard}
            label={t.campaign}
            value={detail.title}
            href={adminPortalRoutes.campaignDetail(detail.id)}
            locale={locale}
          />
          <ArrowRight className="h-4 w-4 text-zinc-300" />
          <ChainNode
            icon={Users}
            label={t.creator}
            value={detail.creator?.name ?? detail.creator?.email ?? "—"}
            href={detail.creator ? adminPortalRoutes.studios : undefined}
            locale={locale}
            active={Boolean(detail.creator)}
          />
          <ArrowRight className="h-4 w-4 text-zinc-300" />
          <ChainNode
            icon={CreditCard}
            label={t.escrow}
            value={detail.escrow ? adminEscrowStatusLabel(detail.escrow.status, locale) : "—"}
            href={adminPortalRoutes.payments}
            locale={locale}
            active={Boolean(detail.escrow)}
          />
          <ArrowRight className="h-4 w-4 text-zinc-300" />
          <ChainNode
            icon={Truck}
            label={t.delivery}
            value={detail.delivery ? adminDeliveryStatusLabel(detail.delivery.status, locale) : "—"}
            locale={locale}
            active={Boolean(detail.delivery)}
          />
          <ArrowRight className="h-4 w-4 text-zinc-300" />
          <ChainNode
            icon={CreditCard}
            label={t.settlement}
            value={adminSettlementStateLabel(detail.settlementState, locale)}
            href={adminPortalRoutes.settlements}
            locale={locale}
          />
        </div>
      </CardContent>
    </Card>
  );
}
