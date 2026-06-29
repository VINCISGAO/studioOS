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
    <IncomeWithdrawalPanel
      locale={locale}
      snapshot={snapshot}
      payoutMethods={payoutMethods}
      withdrawals={withdrawals}
    />
  );
}
