"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { platformPaymentService } from "@/features/payment/platform-payment.service";
import {
  getBrandWalletSnapshot,
  rechargeBrandWallet,
  resetBrandWalletBalanceForTesting
} from "@/features/wallet/brand-wallet.service";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { isPaymentStubMode } from "@/lib/payment/payment-stub";
import { type Locale, withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

export async function rechargeBrandWalletAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    redirect(withLocale("/login?role=brand", lang));
  }

  const amountValues = formData.getAll("amount");
  const amount = Number(amountValues[amountValues.length - 1] ?? 0);
  const returnTo = String(formData.get("return_to") ?? "");
  const accountPath = brandPortalRoutes.financeAccount;

  if (!isPaymentStubMode()) {
    const snapshot = await getBrandWalletSnapshot(clientEmail, 1);
    if (!snapshot.enabled) {
      redirect(withLocale(`${accountPath}?wallet_error=wallet-unavailable`, lang));
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      redirect(withLocale(`${accountPath}?wallet_error=invalid-amount`, lang));
    }

    const successPath =
      returnTo.startsWith("/brand/")
        ? `${returnTo}${returnTo.includes("?") ? "&" : "?"}checkout=success`
        : `${accountPath}?checkout=success`;
    const cancelPath = returnTo.startsWith("/brand/")
      ? `${returnTo}${returnTo.includes("?") ? "&" : "?"}checkout=cancelled`
      : `${accountPath}?checkout=cancelled`;

    let checkoutUrl: string | null = null;
    try {
      const checkout = await platformPaymentService.createBrandWalletRechargeCheckout({
        brandUserId: snapshot.user.id,
        amountUsd: amount,
        successPath,
        cancelPath
      });
      checkoutUrl = checkout.checkoutUrl;
    } catch {
      redirect(withLocale(`${accountPath}?wallet_error=checkout-failed`, lang));
    }

    redirect(checkoutUrl!);
  }

  const result = await rechargeBrandWallet({
    brandEmail: clientEmail,
    amount,
    description: `Brand account recharge ${amount.toFixed(2)}`
  });

  revalidatePath(accountPath);
  if (!result.ok) {
    redirect(withLocale(`${accountPath}?wallet_error=${result.error}`, lang));
  }

  if (returnTo.startsWith("/brand/")) {
    redirect(returnTo);
  }

  redirect(withLocale(`${accountPath}?recharged=1`, lang));
}

export async function resetBrandWalletBalanceForTestingAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    redirect(withLocale("/login?role=brand", lang));
  }

  const result = await resetBrandWalletBalanceForTesting({
    brandEmail: clientEmail,
    description: "Local test reset brand account balance"
  });

  const accountPath = brandPortalRoutes.financeAccount;
  revalidatePath(accountPath);
  if (!result.ok) {
    redirect(withLocale(`${accountPath}?wallet_error=${result.error}`, lang));
  }

  redirect(withLocale(`${accountPath}?balance_reset=1`, lang));
}
