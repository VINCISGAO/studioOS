"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, Zap } from "lucide-react";
import type { EarningConversionQuote } from "@/features/credit-wallet/credit-wallet.types";
import {
  currencySymbol,
  currencyUnitLabel,
  formatMarketAmount,
  USD_CNY_DISPLAY_RATE
} from "@/lib/credits/market-currency";
import type { Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  earningAvailableMinor: number;
  earningCurrency: string;
  onConverted: () => Promise<void> | void;
};

export function CreditsEarningConversionSection({
  locale,
  earningAvailableMinor,
  earningCurrency,
  onConverted
}: Props) {
  const zh = locale === "zh";
  const [convertAmount, setConvertAmount] = useState("");
  const [quote, setQuote] = useState<EarningConversionQuote | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [convertBusy, setConvertBusy] = useState(false);
  const [success, setSuccess] = useState<{ creditsGranted: number; displayAmountMinor: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const earningAmountMinor = useMemo(() => {
    const minor = Math.round(Number(convertAmount) * 100);
    if (!Number.isFinite(minor) || minor <= 0) return null;
    return minor;
  }, [convertAmount]);

  const availableDisplay = formatMarketAmount(earningCurrency, earningAvailableMinor, locale);
  const currencyLabel = currencyUnitLabel(earningCurrency, locale);
  const inputSymbol = currencySymbol(earningCurrency);

  async function fetchQuote() {
    if (!earningAmountMinor) return;
    setQuoteBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(
        `/api/v1/credits/earning-conversion?earningAmountMinor=${earningAmountMinor}`
      );
      const payload = (await response.json()) as {
        success: boolean;
        data?: EarningConversionQuote;
        error?: { message?: string };
      };
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "Unable to quote conversion");
      }
      setQuote(payload.data);
    } catch (quoteError) {
      setQuote(null);
      setError(quoteError instanceof Error ? quoteError.message : "Unable to quote conversion");
    } finally {
      setQuoteBusy(false);
    }
  }

  async function confirmConversion() {
    if (!earningAmountMinor) return;
    setConvertBusy(true);
    setError(null);
    try {
      let activeQuote = quote;
      if (!activeQuote) {
        const quoteResponse = await fetch(
          `/api/v1/credits/earning-conversion?earningAmountMinor=${earningAmountMinor}`
        );
        const quotePayload = (await quoteResponse.json()) as {
          success: boolean;
          data?: EarningConversionQuote;
          error?: { message?: string };
        };
        if (!quoteResponse.ok || !quotePayload.success || !quotePayload.data) {
          throw new Error(quotePayload.error?.message ?? "Unable to quote conversion");
        }
        activeQuote = quotePayload.data;
        setQuote(activeQuote);
      }

      const response = await fetch("/api/v1/credits/earning-conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          earningAmountMinor: activeQuote.earningAmountMinor,
          idempotencyKey: crypto.randomUUID(),
          confirmed: true
        })
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: { creditsGranted: number; earningAmountMinor: number };
        error?: { message?: string };
      };
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "Conversion failed");
      }
      setSuccess({
        creditsGranted: payload.data.creditsGranted,
        displayAmountMinor: activeQuote.displayAmountMinor
      });
      setQuote(null);
      setConvertAmount("");
      await onConverted();
    } catch (conversionError) {
      setError(conversionError instanceof Error ? conversionError.message : "Conversion failed");
    } finally {
      setConvertBusy(false);
    }
  }

  const previewCredits = quote?.creditsGranted ?? null;
  const rateLabel = quote
    ? earningCurrency === "CNY"
      ? `¥${USD_CNY_DISPLAY_RATE.toFixed(2)} = ${quote.exchangeRateSnapshot.creditsPerUnitMinor} Token`
      : `$1.00 = ${quote.exchangeRateSnapshot.creditsPerUnitMinor} Token`
    : null;

  return (
    <section
      id="convert"
      className="flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">
          {zh ? "使用收益兑换" : "Convert earnings"}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {zh ? "将你的创作者收益兑换为 Token" : "Convert your creator earnings to Token"}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
        <p className="text-xs text-zinc-500">{zh ? "可兑换收益" : "Available earnings"}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-2xl font-semibold tabular-nums text-zinc-950">{availableDisplay}</span>
          <span className="text-sm text-zinc-400">{currencyLabel}</span>
          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {zh ? "可用" : "Available"}
          </span>
        </div>
      </div>

      {success ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            {formatMarketAmount(earningCurrency, success.displayAmountMinor, locale)} →{" "}
            {success.creditsGranted.toLocaleString()} Token
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <label className="mt-4 text-sm text-zinc-600">
        {zh ? `兑换金额 (${currencyLabel})` : `Amount (${earningCurrency})`}
      </label>
      <div className="mt-2 flex items-center rounded-xl border border-zinc-200 bg-white pl-3 pr-1.5">
        <span className="text-sm text-zinc-400">{inputSymbol}</span>
        <input
          value={convertAmount}
          onChange={(event) => {
            setConvertAmount(event.target.value);
            setQuote(null);
          }}
          placeholder="0.00"
          className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none"
          inputMode="decimal"
        />
        <button
          type="button"
          disabled={quoteBusy || !earningAmountMinor}
          onClick={() => void fetchQuote()}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-800 disabled:opacity-50"
        >
          {quoteBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : zh ? "预览" : "Preview"}
        </button>
      </div>

      <div className="mt-4 space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">{zh ? "预计获得" : "Estimated Token"}</span>
          <span className="flex items-center gap-1 font-semibold text-violet-600">
            {previewCredits !== null ? (
              <>
                <Zap className="h-3.5 w-3.5" />
                {previewCredits.toLocaleString()} Token
              </>
            ) : (
              <span className="text-zinc-400">{zh ? "点击预览" : "Preview to see"}</span>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">{zh ? "兑换比例" : "Exchange rate"}</span>
          <span className="font-medium text-zinc-800">{rateLabel ?? "—"}</span>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
        {zh
          ? "兑换后不可撤销，Token 不可提现，仅可用于 AI 生成创作。"
          : "Conversion is irreversible. Token cannot be withdrawn and are for AI creation only."}
      </div>

      <div className="mt-auto pt-4">
        <button
          type="button"
          disabled={convertBusy || !earningAmountMinor}
          onClick={() => void confirmConversion()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {convertBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {zh ? "确认兑换" : "Confirm conversion"}
        </button>
      </div>
    </section>
  );
}
