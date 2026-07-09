import { getAppUiLocale } from "@/lib/app-language";
import { AdminCampaignList } from "@/components/studioos/admin-campaign-list";
import { adminCampaignService } from "@/features/admin/campaign/admin-campaign.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams } from "@/lib/i18n";

const copy = {
  en: {
    title: "Campaign management",
    subtitle: "Search and inspect all Prisma-backed campaigns with escrow and settlement state."
  },
  zh: {
    title: "Campaign 管理",
    subtitle: "搜索并查看所有 Prisma Campaign，含托管与结算状态。"
  }
};

export default async function AdminCampaignsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();

  const filters = {
    search: typeof params.search === "string" ? params.search : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    brand: typeof params.brand === "string" ? params.brand : undefined,
    creator: typeof params.creator === "string" ? params.creator : undefined,
    escrow: typeof params.escrow === "string" ? params.escrow : undefined,
    delivery: typeof params.delivery === "string" ? params.delivery : undefined,
    settlement: typeof params.settlement === "string" ? params.settlement : undefined,
    round: typeof params.round === "string" ? params.round : undefined
  };

  const result = user
    ? await adminCampaignService.list(user, {
        search: filters.search,
        status: filters.status,
        brandSearch: filters.brand,
        creatorSearch: filters.creator,
        escrowStatus: filters.escrow,
        deliveryStatus: filters.delivery,
        settlementState: filters.settlement,
        reviewRound: filters.round ? Number.parseInt(filters.round, 10) : undefined
      })
    : { items: [], total: 0 };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
      <div className="mt-8">
        <AdminCampaignList locale={locale} items={result.items} total={result.total} filters={filters} />
      </div>
    </div>
  );
}
