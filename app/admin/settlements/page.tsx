import { getAppUiLocale } from "@/lib/app-language";
import { AdminSettlementQueue } from "@/components/studioos/admin-settlement-queue";
import { adminSettlementService } from "@/features/admin/settlement/admin-settlement.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams } from "@/lib/i18n";

const copy = {
  en: {
    title: "Settlement queue",
    subtitle: "Release escrow, freeze disputes, and retry blocked settlements."
  },
  zh: {
    title: "结算队列",
    subtitle: "释放托管、冻结争议、重试阻塞结算。"
  }
};

export default async function AdminSettlementsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const state = typeof params.state === "string" ? params.state : undefined;
  const items = user ? await adminSettlementService.listQueue(user, { state }) : [];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
      <div className="mt-8">
        <AdminSettlementQueue locale={locale} items={items} />
      </div>
    </div>
  );
}
