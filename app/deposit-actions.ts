"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { platformPaymentService } from "@/features/payment/platform-payment.service";
import { getCreatorDepositSnapshot, submitDepositPayment } from "@/lib/studioos/deposit-service";
import { isPaymentStubMode } from "@/lib/payment/payment-stub";
import { DEPOSIT_PAYMENT_METHODS } from "@/lib/studioos/deposit-utils";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";
import { withLocale, type Locale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

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

function revalidateCertificationPaths() {
  revalidatePath("/studio");
  revalidatePath("/studio", "layout");
  revalidatePath("/studio/deposit");
  revalidatePath("/studio/messages");
  revalidatePath("/studio/invitations");
  revalidatePath("/admin/certification");
}

function certificationCelebratePath(locale: Locale) {
  return withLocale(`${creatorPortalRoutes.home}?certified=1`, locale);
}

export async function startDepositStripeCheckoutAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    redirect(withLocale("/login?role=creator", lang));
  }

  if (isPaymentStubMode()) {
    redirect(withLocale("/studio/deposit?error=stripe-unavailable", lang));
  }

  let checkoutUrl: string | null = null;
  try {
    const checkout = await platformPaymentService.createCreatorDepositCheckout(creatorId, lang);
    checkoutUrl = checkout.checkoutUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : "checkout-failed";
    redirect(withLocale(`/studio/deposit?error=${encodeURIComponent(message)}`, lang));
  }

  redirect(checkoutUrl!);
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

  revalidateCertificationPaths();

  if (!result.ok) {
    const alreadyPaid =
      result.error === "保证金已缴纳" || result.error === "Deposit already paid";
    if (alreadyPaid) {
      const snapshot = await getCreatorDepositSnapshot(creatorId);
      if (snapshot.deposit_status === "paid") {
        redirect(certificationCelebratePath(lang));
      }
    }
    const pendingReview =
      result.error === "已有待确认的保证金付款" ||
      result.error === "A deposit payment is already pending review";
    if (pendingReview) {
      redirect(withLocale("/studio/deposit?submitted=1", lang));
    }
    redirect(withLocale(`/studio/deposit?error=${encodeURIComponent(result.error)}`, lang));
  }

  redirect(certificationCelebratePath(lang));
}

export async function pollDepositStatusAction() {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  const snapshot = await getCreatorDepositSnapshot(creatorId);
  revalidateCertificationPaths();

  return {
    ok: true as const,
    can_accept_orders: snapshot.can_accept_orders,
    deposit_status: snapshot.deposit_status,
    pending_status: snapshot.pending_payment?.status ?? null
  };
}
