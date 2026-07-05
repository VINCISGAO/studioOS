"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck, X } from "lucide-react";

type Locale = "en" | "zh";

type BrandWalletRechargeFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  locale: Locale;
  currency: string;
  hasPendingInvoice: boolean;
  invoiceAmount: number;
  returnTo: string;
};

const PRESET_AMOUNTS = [200, 500, 1000] as const;

function money(amount: number, currency = "USD", locale: Locale = "en") {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    style: "currency",
    currency
  }).format(amount);
}

function normalizeAmount(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return String(Math.round(parsed));
}

export function BrandWalletRechargeForm({
  action,
  locale,
  currency,
  hasPendingInvoice,
  invoiceAmount,
  returnTo
}: BrandWalletRechargeFormProps) {
  const defaultAmount = hasPendingInvoice && Number.isFinite(invoiceAmount) && invoiceAmount > 0
    ? String(Math.round(invoiceAmount))
    : "500";
  const [amount, setAmount] = useState(defaultAmount);
  const [confirming, setConfirming] = useState(false);
  const amountNumber = Number(amount);
  const canSubmit = Number.isFinite(amountNumber) && amountNumber > 0;
  const selectedPreset = useMemo(
    () => PRESET_AMOUNTS.find((preset) => preset === amountNumber) ?? null,
    [amountNumber]
  );

  const title = hasPendingInvoice
    ? locale === "zh"
      ? "支付账单金额"
      : "Invoice amount"
    : locale === "zh"
      ? "充值金额"
      : "Top-up amount";
  const primaryLabel = hasPendingInvoice
    ? locale === "zh"
      ? "确认支付"
      : "Confirm payment"
    : locale === "zh"
      ? "确认充值"
      : "Confirm top-up";
  const finalLabel = hasPendingInvoice
    ? locale === "zh"
      ? "确认并拉起付款"
      : "Confirm and open payment"
    : locale === "zh"
      ? "确认并拉起付款"
      : "Confirm and open payment";

  return (
    <form
      action={action}
      className="relative rounded-2xl border border-zinc-100 bg-white p-7 shadow-[0_18px_42px_rgba(15,23,42,0.07)]"
    >
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="amount" value={amount} />
      {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}

      <label className="text-sm font-semibold text-zinc-900" htmlFor="brand-wallet-amount">
        {title}
      </label>
      <div className="mt-5 flex items-center rounded-xl border border-zinc-200 bg-white px-4 shadow-sm focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-500/10">
        <span className="text-sm font-semibold text-zinc-500">$</span>
        <input
          id="brand-wallet-amount"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          onBlur={() => setAmount((current) => normalizeAmount(current) || defaultAmount)}
          className="h-14 min-w-0 flex-1 bg-transparent px-3 text-lg font-semibold text-zinc-950 outline-none"
        />
      </div>

      {!hasPendingInvoice ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS.map((preset) => {
            const active = selectedPreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                aria-pressed={active}
                className={
                  active
                    ? "rounded-lg border border-violet-300 bg-violet-50 px-3 py-2.5 text-xs font-semibold text-violet-700 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.10)] transition hover:bg-violet-100"
                    : "rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus:border-violet-300 focus:text-violet-700 focus:outline-none"
                }
              >
                {money(preset, currency, locale)}
              </button>
            );
          })}
        </div>
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
          ? "本地测试环境会在你确认后模拟付款完成并入账。"
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
                ? `确认后将拉起付款，金额为 ${money(amountNumber, currency, locale)}。`
                : `After confirmation, payment will open for ${money(amountNumber, currency, locale)}.`}
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
