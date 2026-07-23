import { getAppLanguage, getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, FileText, Inbox, PieChart, WalletCards, Zap } from "lucide-react";
import {
  rechargeBrandWalletAction,
  resetBrandWalletBalanceForTestingAction
} from "@/app/brand-account-actions";
import { BrandWalletRechargeForm } from "@/components/studioos/brand-wallet-recharge-form";
import { getBrandWalletSnapshot } from "@/features/wallet/brand-wallet.service";
import { platformPaymentService } from "@/features/payment/platform-payment.service";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { type Locale, type SearchParams, withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { isPaymentStubMode } from "@/lib/payment/payment-stub";
import { isNextNavigationError } from "@/lib/next-navigation-error";

import {
  formatBrandWalletAmount,
  settlementUsdNote
} from "@/lib/money/display-money";

function money(amount: number, languageCode: Awaited<ReturnType<typeof getAppLanguage>>) {
  return formatBrandWalletAmount(amount, languageCode);
}

function walletErrorMessage(code: string | null, locale: Locale) {
  switch (code) {
    case "invalid-amount":
      return locale === "zh" ? "请输入有效的充值金额。" : "Enter a valid top-up amount.";
    case "checkout-failed":
      return locale === "zh"
        ? "无法拉起 Stripe 付款，请确认支付配置后重试。"
        : "Could not open Stripe checkout. Please verify payment settings and try again.";
    case "wallet-unavailable":
      return locale === "zh"
        ? "钱包账户不可用，请确认已登录品牌账号且数据库已初始化。"
        : "Wallet account unavailable. Confirm you are signed in as a brand and the database is initialized.";
    case "production-disabled":
      return locale === "zh"
        ? "生产环境需通过 Stripe 完成充值，请联系平台管理员配置支付。"
        : "Production top-ups require Stripe checkout. Please contact support if payment is not available.";
    default:
      return locale === "zh" ? "充值失败，请检查金额后重试。" : "Recharge failed. Please check the amount and try again.";
  }
}

function transactionLabel(type: string, locale: "en" | "zh") {
  const labels: Record<string, { en: string; zh: string }> = {
    ESCROW_DEPOSIT: { en: "Recharge / invoice payment", zh: "充值 / 账单支付" },
    CLIENT_SERVICE_FEE: { en: "Service fee", zh: "服务费扣款" },
    REFUND: { en: "Refund", zh: "退款" }
  };
  return labels[type]?.[locale] ?? type;
}

export default async function BrandFinanceAccountPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const locale = await getAppUiLocale();
  const languageCode = await getAppLanguage();
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    redirect(withLocale("/login?role=brand", locale));
  }

  const snapshot = await getBrandWalletSnapshot(clientEmail, 16);
  const accountPath = brandPortalRoutes.financeAccount;
  const stripeSessionId = typeof query.session_id === "string" ? query.session_id.trim() : null;

  if (stripeSessionId && snapshot.enabled && !isPaymentStubMode()) {
    try {
      await platformPaymentService.reconcileBrandWalletCheckoutReturn({
        brandUserId: snapshot.user.id,
        stripeSessionId
      });
    } catch (error) {
      if (isNextNavigationError(error)) throw error;
      // Webhook may still credit the wallet; keep checkout success state below.
    }
    redirect(withLocale(`${accountPath}?recharged=1`, locale));
  }

  const recharged = query.recharged === "1";
  const checkoutSuccess = query.checkout === "success";
  const checkoutCancelled = query.checkout === "cancelled";
  const balanceReset = query.balance_reset === "1";
  const walletError = typeof query.wallet_error === "string" ? query.wallet_error : null;
  const invoiceId = typeof query.invoice_id === "string" ? query.invoice_id : null;
  const invoiceAmount = typeof query.amount === "string" ? Number(query.amount) : 0;
  const returnTo = typeof query.return_to === "string" ? query.return_to : "";
  const hasPendingInvoice = Boolean(invoiceId && Number.isFinite(invoiceAmount) && invoiceAmount > 0);
  const totalDeposited = snapshot.enabled
    ? snapshot.transactions
        .filter((item) => item.type === "ESCROW_DEPOSIT")
        .reduce((sum, item) => sum + item.amount, 0)
    : 0;
  const totalSpent = snapshot.enabled
    ? snapshot.transactions
        .filter((item) => item.type === "CLIENT_SERVICE_FEE")
        .reduce((sum, item) => sum + item.amount, 0)
    : 0;
  const featureCards = [
    {
      icon: WalletCards,
      title: locale === "zh" ? "账户余额" : "Account balance",
      body:
        locale === "zh"
          ? "展示商家当前可用余额，用于平台服务费与加购修订扣款。"
          : "Shows the available brand balance used for platform fees and add-ons."
    },
    {
      icon: Zap,
      title: locale === "zh" ? "直接充值" : "Direct top-up",
      body:
        locale === "zh"
          ? "商家可以在这里提前充值，确认后会模拟付款完成并入账。"
          : "Top up in advance; local testing credits after confirmation."
    },
    {
      icon: CalendarDays,
      title: locale === "zh" ? "支付判定线" : "Payment decision",
      body:
        locale === "zh"
          ? "确认加购时先判断余额，足够则直接扣款；余额不足才拉取新的支付账单。"
          : "Balance is charged first; shortfalls create a new invoice."
    },
    {
      icon: PieChart,
      title: locale === "zh" ? "账户流水" : "Ledger history",
      body:
        locale === "zh"
          ? "记录充值、账单补款、加购服务费扣款，方便核对每一笔资金变化。"
          : "Tracks top-ups, invoice payments, and service fee charges."
    }
  ];

  return (
    <div className="space-y-7">
      <header className="space-y-2">
        <Link href={withLocale("/brand", locale)} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← {locale === "zh" ? "返回首页" : "Back home"}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {locale === "zh" ? "账户余额" : "Account balance"}
        </h1>
        <p className="max-w-4xl text-sm leading-6 text-zinc-500">
          {locale === "zh"
            ? "充值后的余额会优先用于支付加购修订等平台服务费；余额不足时系统会拉取新的支付账单补足差额。"
            : "Your balance is used first for paid revision add-ons and platform service fees; if it is insufficient, a new invoice covers the shortfall."}
        </p>
      </header>

      {!snapshot.enabled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          {locale === "zh"
            ? "当前环境暂未启用钱包账户，请先确认数据库与品牌用户已初始化。"
            : "Wallet accounts are not enabled in this environment. Please confirm the database and brand user are initialized."}
        </div>
      ) : (
        <>
          {recharged || checkoutSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {locale === "zh" ? "充值成功，账户余额已更新。" : "Recharge completed. Your balance has been updated."}
            </div>
          ) : null}
          {checkoutCancelled ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {locale === "zh" ? "付款已取消，可重新发起充值。" : "Payment cancelled. You can start a new top-up."}
            </div>
          ) : null}
          {balanceReset ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {locale === "zh" ? "测试余额已清空，可以重新测试拉起付费流程。" : "Test balance cleared. You can retry the payment flow."}
            </div>
          ) : null}
          {walletError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {walletErrorMessage(walletError, locale)}
            </div>
          ) : null}
          {hasPendingInvoice ? (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm text-violet-900">
              <p className="font-semibold">
                {locale === "zh" ? "待支付加购账单" : "Pending add-on invoice"}
              </p>
              <p className="mt-1 text-xs leading-5 text-violet-700">
                {locale === "zh"
                  ? `账单 ${invoiceId} 需要支付 ${money(invoiceAmount, languageCode)}。完成付款后会回到审片页，你可以继续确认加购并解锁第 4 轮。`
                  : `Invoice ${invoiceId} requires ${money(invoiceAmount, languageCode)}. After payment you will return to review and can confirm the add-on again to unlock round 4.`}
              </p>
            </div>
          ) : null}

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex min-h-[124px] gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                    <Icon className="h-6 w-6" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-950">{item.title}</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-100 bg-white p-8 shadow-[0_18px_42px_rgba(15,23,42,0.07)]">
              <div className="relative z-10 max-w-[560px]">
                <p className="text-base font-medium text-zinc-500">
                  {locale === "zh" ? "可用余额" : "Available balance"}
                </p>
                <p className="mt-5 text-5xl font-semibold tracking-tight text-zinc-950">
                  {money(snapshot.wallet.availableBalance, languageCode)}
                </p>
                {settlementUsdNote(languageCode) ? (
                  <p className="mt-2 text-xs leading-5 text-zinc-400">{settlementUsdNote(languageCode)}</p>
                ) : null}
                {process.env.NODE_ENV !== "production" ? (
                  <form action={resetBrandWalletBalanceForTestingAction} className="mt-4">
                    <input type="hidden" name="lang" value={locale} />
                    <button
                      type="submit"
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      {locale === "zh" ? "清空测试余额" : "Clear test balance"}
                    </button>
                  </form>
                ) : null}
                <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-500">
                  {locale === "zh"
                    ? "确认加购修订时，系统会先从这里扣款；余额不够时才拉取新的支付账单并补足差额。"
                    : "When confirming a paid revision add-on, VINCIS charges this balance first; only a shortfall creates a new invoice."}
                </p>

                <div className="mt-7 grid max-w-lg grid-cols-2 gap-4">
                  <div className="rounded-xl border border-zinc-100 bg-white/85 p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                        <WalletCards className="h-4 w-4" />
                      </span>
                      <p className="text-xs text-zinc-500">
                        {locale === "zh" ? "总充值金额" : "Total recharged"}
                      </p>
                    </div>
                    <p className="mt-2 text-base font-semibold text-zinc-950">
                      {money(totalDeposited, languageCode)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-100 bg-white/85 p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <FileText className="h-4 w-4" />
                      </span>
                      <p className="text-xs text-zinc-500">
                        {locale === "zh" ? "总支出金额" : "Total spent"}
                      </p>
                    </div>
                    <p className="mt-2 text-base font-semibold text-zinc-950">
                      {money(totalSpent, languageCode)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute bottom-8 right-10 hidden h-40 w-44 lg:block">
                <div className="absolute bottom-0 right-4 h-28 w-28 rounded-[2rem] bg-violet-200/70 shadow-[0_22px_44px_rgba(124,58,237,0.22)]" />
                <div className="absolute bottom-5 right-8 h-20 w-28 rotate-6 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-300 to-violet-500 shadow-[0_18px_30px_rgba(124,58,237,0.26)]">
                  <div className="absolute left-6 top-8 h-5 w-5 rounded-full border-4 border-violet-100 bg-white" />
                  <div className="absolute -top-2 left-3 h-4 w-16 rounded-full bg-violet-100/90" />
                </div>
                <div className="absolute bottom-0 left-8 h-9 w-9 rounded-full bg-violet-100 shadow-sm" />
                <div className="absolute bottom-3 left-0 h-7 w-7 rounded-full bg-violet-200 shadow-sm" />
                <div className="absolute right-0 top-0 text-violet-200">+</div>
                <div className="absolute right-8 top-5 text-violet-200">+</div>
              </div>
            </div>

            <BrandWalletRechargeForm
              action={rechargeBrandWalletAction}
              locale={locale}
              languageCode={languageCode}
              hasPendingInvoice={hasPendingInvoice}
              invoiceAmountUsd={invoiceAmount}
              returnTo={returnTo}
              stripeCheckoutEnabled={!isPaymentStubMode()}
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
            <div className="border-b border-zinc-100 px-7 py-5">
              <h2 className="text-sm font-semibold text-zinc-900">
                {locale === "zh" ? "最近流水" : "Recent transactions"}
              </h2>
            </div>
            {snapshot.transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-300">
                  <Inbox className="h-6 w-6" />
                </span>
                <p className="mt-4 text-sm font-medium text-zinc-500">
                  {locale === "zh" ? "暂无账户流水" : "No account transactions yet"}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {locale === "zh"
                    ? "当有充值、扣款或补款记录时将在这里展示"
                    : "Top-ups, charges, and invoice payments will appear here."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {snapshot.transactions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 px-7 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {transactionLabel(item.type, locale)}
                      </p>
                      <p className="mt-1 truncate text-xs text-zinc-500">{item.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-zinc-950">
                        {money(item.amount, languageCode)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        }).format(new Date(item.createdAt))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
