"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck, X } from "lucide-react";
import type { SupportedLanguageCode } from "@/features/i18n/language.constants";
import type { Locale } from "@/lib/i18n";
import {
  brandWalletCurrencyLabel,
  convertDisplayAmountToUsd,
  convertUsdToDisplayAmount,
  formatBrandWalletAmount,
  getCurrencySymbol,
  settlementUsdNote
} from "@/lib/money/display-money";

type BrandWalletRechargeFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  locale: Locale;
  languageCode: SupportedLanguageCode;
  hasPendingInvoice: boolean;
  invoiceAmountUsd: number;
  returnTo: string;
  stripeCheckoutEnabled?: boolean;
};

const PRESET_USD_AMOUNTS = [200, 500, 1000] as const;

function normalizeDisplayAmount(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return String(Math.max(1, Math.round(parsed)));
}

function usdToDisplayInput(amountUsd: number, languageCode: SupportedLanguageCode) {
  return String(convertUsdToDisplayAmount(amountUsd, languageCode));
}

export function BrandWalletRechargeForm({
  action,
  locale,
  languageCode,
  hasPendingInvoice,
  invoiceAmountUsd,
  returnTo,
  stripeCheckoutEnabled = false
}: BrandWalletRechargeFormProps) {
  const defaultUsd =
    hasPendingInvoice && Number.isFinite(invoiceAmountUsd) && invoiceAmountUsd > 0 ? invoiceAmountUsd : 500;
  const [displayAmount, setDisplayAmount] = useState(usdToDisplayInput(defaultUsd, languageCode));
  const [confirming, setConfirming] = useState(false);
  const displayNumber = Number(displayAmount);
  const amountUsd = convertDisplayAmountToUsd(displayNumber, languageCode);
  const canSubmit = Number.isFinite(displayNumber) && displayNumber > 0 && amountUsd > 0;
  const currencySymbol = getCurrencySymbol(languageCode);
  const currencyLabel = brandWalletCurrencyLabel(languageCode);
  const settlementNote = settlementUsdNote(languageCode);

  const selectedPresetUsd = useMemo(() => {
    return (
      PRESET_USD_AMOUNTS.find(
        (preset) => convertUsdToDisplayAmount(preset, languageCode) === Math.round(displayNumber)
      ) ?? null
    );
  }, [displayNumber, languageCode]);

  const title = hasPendingInvoice
    ? locale === "zh"
      ? "支付账单金额"
      : "Invoice amount"
    : locale === "zh"
      ? `充值金额（${currencyLabel}）`
      : `Top-up amount (${currencyLabel})`;
  const primaryLabel = hasPendingInvoice
    ? locale === "zh"
      ? "确认支付"
      : "Confirm payment"
    : locale === "zh"
      ? "确认充值"
      : "Confirm top-up";
  const finalLabel =
    locale === "zh" ? "确认并拉起付款" : "Confirm and open payment";

  return (
    <form
      action={action}
      className="relative rounded-2xl border border-zinc-100 bg-white p-7 shadow-[0_18px_42px_rgba(15,23,42,0.07)]"
    >
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="amount" value={canSubmit ? String(amountUsd) : ""} />
      {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}

      <label className="text-sm font-semibold text-zinc-900" htmlFor="brand-wallet-amount">
        {title}
      </label>
      <div className="mt-5 flex items-center rounded-xl border border-zinc-200 bg-white px-4 shadow-sm focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-500/10">
        <span className="text-sm font-semibold text-zinc-500">{currencySymbol}</span>
        <input
          id="brand-wallet-amount"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={displayAmount}
          onChange={(event) => setDisplayAmount(event.target.value)}
          onBlur={() =>
            setDisplayAmount((current) => normalizeDisplayAmount(current) || usdToDisplayInput(defaultUsd, languageCode))
          }
          className="h-14 min-w-0 flex-1 bg-transparent px-3 text-lg font-semibold text-zinc-950 outline-none"
        />
      </div>

      {!hasPendingInvoice ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {PRESET_USD_AMOUNTS.map((presetUsd) => {
            const active = selectedPresetUsd === presetUsd;
            return (
              <button
                key={presetUsd}
                type="button"
                onClick={() => setDisplayAmount(usdToDisplayInput(presetUsd, languageCode))}
                aria-pressed={active}
                className={
                  active
                    ? "rounded-lg border border-violet-300 bg-violet-50 px-3 py-2.5 text-xs font-semibold text-violet-700 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.10)] transition hover:bg-violet-100"
                    : "rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus:border-violet-300 focus:text-violet-700 focus:outline-none"
                }
              >
                {formatBrandWalletAmount(presetUsd, languageCode)}
              </button>
            );
          })}
        </div>
      ) : null}

      {settlementNote ? (
        <p className="mt-3 text-xs leading-5 text-zinc-500">{settlementNote}</p>
      ) : null}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => setConfirming(true)}
        className="mt-4 h-12 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(124,58,237,0.24)] transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
      >
        {primaryLabel}
      </button>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-zinc-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
        {locale === "zh"
          ? stripeCheckoutEnabled
            ? "确认后将跳转 Stripe 安全收银台，付款成功后自动入账。"
            : "本地测试环境会在你确认后模拟付款完成并入账。"
          : stripeCheckoutEnabled
            ? "After confirmation you will be redirected to Stripe checkout. Funds are credited after payment."
            : "In local testing, payment is simulated and credited after confirmation."}
      </p>

      {confirming ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-zinc-950/35 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <button
                type="button"
                aria-label={locale === "zh" ? "关闭确认" : "Close confirmation"}
                onClick={() => setConfirming(false)}
                className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2 className="mt-4 text-base font-semibold text-zinc-950">
              {locale === "zh" ? "确认充值金额" : "Confirm amount"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {locale === "zh"
                ? `确认后将拉起付款，金额为 ${formatBrandWalletAmount(amountUsd, languageCode)}。`
                : `After confirmation, payment will open for ${formatBrandWalletAmount(amountUsd, languageCode)}.`}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="h-11 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                {locale === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="h-11 rounded-xl bg-violet-600 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                {finalLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
