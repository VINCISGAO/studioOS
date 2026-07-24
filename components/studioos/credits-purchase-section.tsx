"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, Lock, ShieldCheck } from "lucide-react";
import {
  CreditsCustomPurchaseOption,
  isValidCustomCreditAmount
} from "@/components/studioos/credits-custom-purchase-option";
import type {
  CreditCustomPurchaseTermsView,
  CreditPurchaseOrderView,
  ResolvedCreditPackageView
} from "@/features/credit-wallet/credit-wallet.types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type CheckoutNotice = {
  kind: "success" | "cancelled";
  orderId: string;
} | null;

type PurchaseSelection =
  | { kind: "package"; packageId: string }
  | { kind: "custom"; credits: number };

export function CreditsPurchaseSection({
  locale,
  initialPackages,
  customTerms,
  checkoutNotice,
  onBalanceChange
}: {
  locale: Locale;
  initialPackages: ResolvedCreditPackageView[];
  customTerms: CreditCustomPurchaseTermsView | null;
  checkoutNotice: CheckoutNotice;
  onBalanceChange?: () => void;
}) {
  const zh = locale === "zh";
  const [packages, setPackages] = useState(initialPackages);
  const [selection, setSelection] = useState<PurchaseSelection>(() => ({
    kind: "package",
    packageId: initialPackages[0]?.id ?? ""
  }));
  const [customCredits, setCustomCredits] = useState(customTerms?.minCredits ?? 500);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedPackage = useMemo(
    () =>
      selection.kind === "package"
        ? packages.find((pkg) => pkg.id === selection.packageId) ?? packages[0] ?? null
        : null,
    [packages, selection]
  );

  const customSelectionValid =
    selection.kind !== "custom" || !customTerms || isValidCustomCreditAmount(customCredits, customTerms);

  useEffect(() => {
    setPackages(initialPackages);
    if (initialPackages[0]?.id) {
      setSelection((current) =>
        current.kind === "package" && initialPackages.some((pkg) => pkg.id === current.packageId)
          ? current
          : { kind: "package", packageId: initialPackages[0]!.id }
      );
    }
  }, [initialPackages]);

  useEffect(() => {
    if (!checkoutNotice) return;
    if (checkoutNotice.kind === "cancelled") {
      setNotice(zh ? "支付已取消。" : "Checkout cancelled.");
      return;
    }
    setNotice(zh ? "支付成功，正在确认入账…" : "Payment received. Confirming Token…");
    void pollOrder(checkoutNotice.orderId);
  }, [checkoutNotice, zh]);

  async function pollOrder(orderId: string) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
      const response = await fetch(`/api/v1/credits/purchase/orders/${orderId}`);
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { order?: CreditPurchaseOrderView };
      };
      if (!response.ok || !payload.success || !payload.data?.order) continue;
      if (payload.data.order.status === "CREDITED") {
        setNotice(
          zh
            ? `已入账 ${payload.data.order.totalCredits.toLocaleString()} Token`
            : `${payload.data.order.totalCredits.toLocaleString()} Token added`
        );
        onBalanceChange?.();
        return;
      }
      if (payload.data.order.status === "FAILED" || payload.data.order.status === "CANCELLED") {
        setNotice(zh ? "订单未完成。" : "Order did not complete.");
        return;
      }
    }
    setNotice(zh ? "入账处理中，请稍后刷新。" : "Crediting in progress — refresh shortly.");
  }

  async function startCheckout() {
    if (selection.kind === "package" && !selectedPackage) return;
    if (selection.kind === "custom" && !customSelectionValid) return;

    setBusy(true);
    setError(null);
    try {
      const previewBody =
        selection.kind === "custom"
          ? { customCredits: customCredits }
          : { packageId: selectedPackage!.id };

      const previewResponse = await fetch("/api/v1/credits/purchase/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(previewBody)
      });
      const previewPayload = (await previewResponse.json()) as {
        success?: boolean;
        data?: { preview?: { totalCredits: number } };
        error?: { message?: string };
      };
      if (!previewResponse.ok || !previewPayload.success || !previewPayload.data?.preview) {
        throw new Error(previewPayload.error?.message ?? "Unable to confirm checkout price");
      }

      const response = await fetch("/api/v1/credits/purchase/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...previewBody,
          idempotencyKey: crypto.randomUUID()
        })
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { checkoutUrl?: string | null };
        error?: { message?: string };
      };
      if (!response.ok || !payload.success || !payload.data?.checkoutUrl) {
        throw new Error(payload.error?.message ?? "Checkout failed");
      }
      window.location.href = payload.data.checkoutUrl;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  const canCheckout =
    !busy &&
    ((selection.kind === "package" && Boolean(selectedPackage)) ||
      (selection.kind === "custom" && customSelectionValid));

  return (
    <section className="flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">{zh ? "购买 Token" : "Buy Token"}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {zh ? "选择套餐或自定义数量" : "Choose a package or enter a custom amount"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          {zh ? "安全支付 · Stripe 处理" : "Secure · Stripe checkout"}
        </div>
      </div>

      {notice ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {packages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-zinc-500">
          {zh ? "暂无可购买套餐" : "No packages available"}
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-2.5">
            {packages.map((pkg, index) => {
              const selected = selection.kind === "package" && selectedPackage?.id === pkg.id;
              const recommended = index === 0;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelection({ kind: "package", packageId: pkg.id })}
                  className={cn(
                    "relative w-full rounded-xl border px-4 py-3.5 text-left transition",
                    selected
                      ? "border-violet-500 bg-violet-50/30 shadow-[0_0_0_1px_rgba(124,58,237,0.35)]"
                      : "border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  {selected ? (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </span>
                  ) : null}

                  <div className="flex items-start justify-between gap-4 pr-8">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-950">{pkg.name}</span>
                        {recommended ? (
                          <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                            {zh ? "推荐" : "Popular"}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                        <span>{pkg.totalCredits.toLocaleString()} Token</span>
                        {pkg.bonusCredits > 0 ? (
                          <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[11px] text-sky-700">
                            {zh ? `含赠送 ${pkg.bonusCredits.toLocaleString()}` : `+${pkg.bonusCredits} bonus`}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-base font-semibold tabular-nums text-zinc-950">
                      {pkg.displayPrice}
                    </div>
                  </div>
                </button>
              );
            })}

            {customTerms ? (
              <CreditsCustomPurchaseOption
                locale={locale}
                selected={selection.kind === "custom"}
                terms={customTerms}
                customCredits={customCredits}
                onSelect={() => setSelection({ kind: "custom", credits: customCredits })}
                onCreditsChange={(value) => {
                  setCustomCredits(value);
                  setSelection({ kind: "custom", credits: value });
                }}
              />
            ) : null}
          </div>

          <div className="mt-auto space-y-3 pt-5">
            <button
              type="button"
              disabled={!canCheckout}
              onClick={() => void startCheckout()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
            >
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {zh ? "继续到支付" : "Continue to payment"}
            </button>
            <p className="flex items-start gap-1.5 text-xs leading-5 text-zinc-400">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" />
              {zh
                ? "仅 Stripe Webhook 验证成功后才会入账，支付更安全可靠。"
                : "Tokens are credited only after verified Stripe webhook for secure settlement."}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
