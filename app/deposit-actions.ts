"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { getCreatorDepositSnapshot, submitDepositPayment } from "@/lib/studioos/deposit-service";
import { DEPOSIT_PAYMENT_METHODS } from "@/lib/studioos/deposit-utils";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";
import { withLocale, type Locale } from "@/lib/i18n";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

function parsePaymentMethod(raw: FormDataEntryValue | null): PayoutMethodType | null {
  const value = String(raw ?? "");
  if (DEPOSIT_PAYMENT_METHODS.includes(value as PayoutMethodType)) {
    return value as PayoutMethodType;
  }
  return null;
}

export async function submitDepositPaymentAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const creatorId = await getCurrentCreatorId();
  const paymentMethod = parsePaymentMethod(formData.get("payment_method"));
  const paymentReference = String(formData.get("payment_reference") ?? "").trim();

  if (!creatorId || !paymentMethod) {
    redirect(withLocale("/studio/deposit?error=invalid", lang));
  }

  const result = await submitDepositPayment(creatorId, {
    payment_method: paymentMethod,
    payment_reference: paymentReference || undefined,
    locale: lang
  });

  if (!result.ok) {
    redirect(withLocale(`/studio/deposit?error=${encodeURIComponent(result.error)}`, lang));
  }

  revalidatePath("/studio");
  revalidatePath("/studio/deposit");
  redirect(withLocale("/studio/deposit?submitted=1", lang));
}

export async function pollDepositStatusAction() {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  const snapshot = await getCreatorDepositSnapshot(creatorId);
  revalidatePath("/studio");
  revalidatePath("/studio/deposit");

  return {
    ok: true as const,
    can_accept_orders: snapshot.can_accept_orders,
    deposit_status: snapshot.deposit_status,
    pending_status: snapshot.pending_payment?.status ?? null
  };
}
