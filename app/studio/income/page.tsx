import { redirect } from "next/navigation";
import { IncomeWithdrawalPanel } from "@/components/studioos/income-withdrawal-panel";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import {
  getCreatorIncomeSnapshot,
  listPayoutMethods,
  listWithdrawals
} from "@/lib/studioos/withdrawal-service";

export default async function StudioIncomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const creator = await getCurrentCreator();
  if (!creator) redirect(withLocale("/login?role=creator", locale));

  const [snapshot, payoutMethods, withdrawals] = await Promise.all([
    getCreatorIncomeSnapshot(creator.id),
    listPayoutMethods(creator.id),
    listWithdrawals(creator.id)
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
          {locale === "zh" ? "收入中心" : "Income center"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {locale === "zh"
            ? "可提现、待结算、历史收入与提现记录。"
            : "Withdrawable balance, pending settlement, history, and withdrawals."}
        </p>
      </header>
      <IncomeWithdrawalPanel
        locale={locale}
        snapshot={snapshot}
        payoutMethods={payoutMethods}
        withdrawals={withdrawals}
      />
    </div>
  );
}
