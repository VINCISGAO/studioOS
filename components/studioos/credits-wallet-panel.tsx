"use client";

import { useState, type ReactNode } from "react";
import { Gift, ShoppingBag, TrendingDown, Wallet, Zap } from "lucide-react";
import { CreditsEarningConversionSection } from "@/components/studioos/credits-earning-conversion-section";
import { CreditsPurchaseSection } from "@/components/studioos/credits-purchase-section";
import { CreditsTransactionHistory } from "@/components/studioos/credits-transaction-history";
import type {
  CreditCustomPurchaseTermsView,
  CreditWalletSummary,
  ResolvedCreditPackageView
} from "@/features/credit-wallet/credit-wallet.types";
import type { Locale } from "@/lib/i18n";

type DashboardPayload = {
  summary: CreditWalletSummary;
  earningAvailableMinor: number;
  earningCurrency: string;
  accountNetDisplay: string;
};

export function CreditsWalletPanel({
  locale,
  initial,
  initialPackages,
  customTerms,
  checkoutNotice = null
}: {
  locale: Locale;
  initial: DashboardPayload;
  initialPackages: ResolvedCreditPackageView[];
  customTerms: CreditCustomPurchaseTermsView | null;
  checkoutNotice?: { kind: "success" | "cancelled"; orderId: string } | null;
}) {
  const [dashboard, setDashboard] = useState(initial);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const zh = locale === "zh";

  async function refreshDashboard() {
    const response = await fetch("/api/v1/credits/wallet");
    const payload = (await response.json()) as { success: boolean; data?: DashboardPayload };
    if (response.ok && payload.success && payload.data) {
      setDashboard(payload.data);
    }
    setHistoryRefreshKey((key) => key + 1);
  }

  const lifetimeEarned =
    dashboard.summary.lifetimePurchased + dashboard.summary.lifetimeBonus;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <p className="text-sm text-zinc-500">{zh ? "可用 Token" : "Available Token"}</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-100 bg-violet-50">
                <Zap className="h-5 w-5 text-violet-600" />
              </div>
              <span className="text-4xl font-semibold tabular-nums tracking-tight text-zinc-950">
                {dashboard.summary.availableCredits.toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              {zh ? "可用余额" : "Available"}
              {" · "}
              {zh ? "冻结" : "Frozen"} {dashboard.summary.reservedCredits.toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <HeroStat
              icon={<TrendingDown className="h-4 w-4 text-violet-600" />}
              iconClassName="bg-violet-50"
              label={zh ? "本月消耗" : "This month"}
              value={dashboard.summary.monthSpent.toLocaleString()}
            />
            <HeroStat
              icon={<ShoppingBag className="h-4 w-4 text-emerald-600" />}
              iconClassName="bg-emerald-50"
              label={zh ? "累计购买" : "Purchased"}
              value={dashboard.summary.lifetimePurchased.toLocaleString()}
            />
            <HeroStat
              icon={<Gift className="h-4 w-4 text-orange-500" />}
              iconClassName="bg-orange-50"
              label={zh ? "累计获得" : "Total earned"}
              value={lifetimeEarned.toLocaleString()}
            />
            <HeroStat
              icon={<Wallet className="h-4 w-4 text-sky-600" />}
              iconClassName="bg-sky-50"
              label={zh ? "账户净值" : "Net value"}
              value={dashboard.accountNetDisplay}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <CreditsPurchaseSection
          locale={locale}
          initialPackages={initialPackages}
          customTerms={customTerms}
          checkoutNotice={checkoutNotice}
          onBalanceChange={() => void refreshDashboard()}
        />
        <CreditsEarningConversionSection
          locale={locale}
          earningAvailableMinor={dashboard.earningAvailableMinor}
          earningCurrency={dashboard.earningCurrency}
          onConverted={() => refreshDashboard()}
        />
      </section>

      <CreditsTransactionHistory locale={locale} refreshKey={historyRefreshKey} />
    </div>
  );
}

function HeroStat({
  icon,
  iconClassName,
  label,
  value
}: {
  icon: ReactNode;
  iconClassName: string;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[5rem]">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${iconClassName}`}>
        {icon}
      </div>
      <div className="text-lg font-semibold tabular-nums text-zinc-950">{value}</div>
      <div className="mt-0.5 text-xs text-zinc-500">{label}</div>
    </div>
  );
}
