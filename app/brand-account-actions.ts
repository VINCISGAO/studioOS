"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  rechargeBrandWallet,
  resetBrandWalletBalanceForTesting
} from "@/features/wallet/brand-wallet.service";
import { getCurrentClientEmail } from "@/features/auth/session-context";
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
  const result = await rechargeBrandWallet({
    brandEmail: clientEmail,
    amount,
    description: `Brand account recharge ${amount.toFixed(2)}`
  });

  const accountPath = brandPortalRoutes.financeAccount;
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
