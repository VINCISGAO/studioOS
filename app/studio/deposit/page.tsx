import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { CreatorCertificationHub } from "@/components/studioos/creator-certification-hub";
import { getCurrentCreator } from "@/features/auth/session-context";
import { resolveCreatorCertificationAccessFromOrders } from "@/lib/studioos/creator-certification-access";
import { depositRequiredMessage } from "@/lib/studioos/deposit-copy";
import { hasCompletedCreatorProfile } from "@/lib/studioos/deposit-guard";
import { hasSeenCertificationLevelUp } from "@/lib/studioos/creator-settings-service";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { listOrdersForCreator } from "@/lib/order-service";
import { isPaymentStubMode } from "@/lib/payment/payment-stub";
import { isStripeEmbeddedReady } from "@/lib/payment/stripe-publishable";
import { stripeEmbeddedPaymentService } from "@/features/payment/stripe-embedded-payment.service";
import { getSessionUser } from "@/features/auth/session.service";
import { isNextNavigationError } from "@/lib/next-navigation-error";

export const dynamic = "force-dynamic";

function certificationCelebratePath(locale: "en" | "zh") {
  return withLocale(`${creatorPortalRoutes.home}?certified=1`, locale);
}

export default async function StudioDepositPage({
  searchParams
}: {
  searchParams: Promise<SearchParams & {
    submitted?: string;
    error?: string;
    scroll?: string;
    stay?: string;
    checkout?: string;
    payment_intent?: string;
  }>;
}) {
  const query = await searchParams;
  const locale = await getAppUiLocale();
  const creator = await getCurrentCreator();

  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const orders = await listOrdersForCreator(creator.id);
  const access = await resolveCreatorCertificationAccessFromOrders(creator.id, orders);
  const levelUpSeen = await hasSeenCertificationLevelUp(creator.id);

  if (access.snapshot.deposit_status === "paid" && !levelUpSeen && query.stay !== "1") {
    redirect(certificationCelebratePath(locale));
  }

  const errorMessage =
    query.error === "deposit-required"
      ? depositRequiredMessage(locale)
      : query.error
        ? decodeURIComponent(query.error)
        : undefined;
  const depositAlreadyPaidError =
    errorMessage === "保证金已缴纳" || errorMessage === "Deposit already paid";

  if (depositAlreadyPaidError && access.snapshot.deposit_status === "paid") {
    redirect(certificationCelebratePath(locale));
  }

  const mode = access.isVerified
    ? "certified"
    : access.isLockedAfterFirstOrder
      ? "required"
      : "optional";

  const scrollToPayment = query.scroll === "pay";
  const paymentIntentId =
    typeof query.payment_intent === "string" ? query.payment_intent.trim() : null;

  if (query.checkout === "success" && paymentIntentId) {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      redirect(withLocale("/login?role=creator", locale));
    }
    try {
      await stripeEmbeddedPaymentService.reconcileCreatorDepositIntent(
        paymentIntentId,
        sessionUser.id
      );
    } catch (error) {
      if (isNextNavigationError(error)) throw error;
      redirect(withLocale(`/studio/deposit?error=${encodeURIComponent("payment-verification")}`, locale));
    }
    redirect(certificationCelebratePath(locale));
  }

  return (
    <CreatorCertificationHub
      locale={locale}
      creatorId={creator.id}
      snapshot={access.snapshot}
      mode={mode}
      completedOrders={access.completedOrders}
      submitted={query.submitted === "1"}
      error={depositAlreadyPaidError ? undefined : errorMessage}
      profileComplete={hasCompletedCreatorProfile(creator)}
      scrollToPayment={scrollToPayment}
      embeddedCheckoutEnabled={isStripeEmbeddedReady()}
      stripeCheckoutEnabled={!isStripeEmbeddedReady() && !isPaymentStubMode()}
    />
  );
}
