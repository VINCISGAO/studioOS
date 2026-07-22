import { redirect } from "next/navigation";
import { CreditsWalletPanel } from "@/components/studioos/credits-wallet-panel";
import { creditPackageRegionalPricingService } from "@/features/credit-wallet/credit-package-regional-pricing.service";
import { creditWalletService } from "@/features/credit-wallet/credit-wallet.service";
import { getCurrentAuthUser } from "@/features/auth/session-context";
import { getAppUiLocale } from "@/lib/app-language";
import { type SearchParams, withLocale } from "@/lib/i18n";

export default async function StudioCreditsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = await getAppUiLocale();
  const user = await getCurrentAuthUser();
  if (!user || user.role !== "CREATOR") redirect(withLocale("/login?role=creator", locale));

  const [dashboard, catalog] = await Promise.all([
    creditWalletService.getDashboard(user, locale),
    creditPackageRegionalPricingService.listPackagesForUser({ user, uiLocale: locale })
  ]);
  const customTerms = creditPackageRegionalPricingService.getCustomPurchaseTermsFromPackages(
    catalog.packages,
    locale
  );
  const checkout = typeof params.checkout === "string" ? params.checkout : null;
  const orderId = typeof params.order_id === "string" ? params.order_id : null;
  const checkoutNotice =
    checkout === "success" && orderId
      ? { kind: "success" as const, orderId }
      : checkout === "cancelled" && orderId
        ? { kind: "cancelled" as const, orderId }
        : null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
          {locale === "zh" ? "Token 管理" : "Token Management"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {locale === "zh"
            ? "AI 创作工具专用 Token 钱包，安全、透明、可追溯。"
            : "Dedicated Token wallet for AI creation tools — secure, transparent, and traceable."}
        </p>
      </header>
      <CreditsWalletPanel
        locale={locale}
        initial={dashboard}
        initialPackages={catalog.packages}
        customTerms={customTerms}
        checkoutNotice={checkoutNotice}
      />
    </div>
  );
}
