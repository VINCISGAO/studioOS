import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { IncomeWithdrawalPanel } from "@/components/studioos/income-withdrawal-panel";
import { getCurrentCreator } from "@/lib/creator-session";
import { resolveCreatorCertificationAccessFromOrders } from "@/lib/studioos/creator-certification-access";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { listOrdersForCreator } from "@/lib/order-service";
import {
  getCreatorIncomeSnapshot,
  listPayoutMethods,
  listWithdrawals
} from "@/lib/studioos/withdrawal-service";
import Link from "next/link";

export default async function StudioIncomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const creator = await getCurrentCreator();
  if (!creator) redirect(withLocale("/login?role=creator", locale));

  const orders = await listOrdersForCreator(creator.id);
  const access = await resolveCreatorCertificationAccessFromOrders(creator.id, orders);

  const [snapshot, payoutMethods, withdrawals] = await Promise.all([
    getCreatorIncomeSnapshot(creator.id),
    listPayoutMethods(creator.id),
    listWithdrawals(creator.id)
  ]);

  return (
    <div className="space-y-6">
      {access.isLockedAfterFirstOrder ? (
        <section className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-950">
          {locale === "zh" ? (
            <>
              你的免费首单已完成，接单相关功能需
              <Link href={withLocale("/studio/deposit", locale)} className="mx-1 font-semibold underline">
                成为认证服务商
              </Link>
              后解锁。此处仍可查看收入、绑定收款方式并提现。
            </>
          ) : (
            <>
              Your free project is complete — certify to accept new orders.{" "}
              <Link href={withLocale("/studio/deposit", locale)} className="font-semibold underline">
                Become a certified provider
              </Link>{" "}
              to unlock invitations and production tools. Withdrawals stay available here.
            </>
          )}
        </section>
      ) : null}
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
