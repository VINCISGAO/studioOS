import { redirect } from "next/navigation";
import { CreatorCertificationHub } from "@/components/studioos/creator-certification-hub";
import { getCurrentCreator } from "@/lib/creator-session";
import { getCreatorDepositSnapshot } from "@/lib/studioos/deposit-service";
import { depositRequiredMessage } from "@/lib/studioos/deposit-copy";
import {
  countCompletedCreatorOrders,
  getCreatorAccessState,
  hasCompletedCreatorProfile
} from "@/lib/studioos/deposit-guard";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { listOrdersForCreator } from "@/lib/order-service";

export const dynamic = "force-dynamic";

export default async function StudioDepositPage({
  searchParams
}: {
  searchParams: Promise<SearchParams & { submitted?: string; error?: string }>;
}) {
  const query = await searchParams;
  const locale = getLocale(query);
  const creator = await getCurrentCreator();

  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const orders = await listOrdersForCreator(creator.id);
  const access = getCreatorAccessState(creator, countCompletedCreatorOrders(orders));
  const snapshot = await getCreatorDepositSnapshot(creator.id);
  const errorMessage =
    query.error === "deposit-required"
      ? depositRequiredMessage(locale)
      : query.error
        ? decodeURIComponent(query.error)
        : undefined;

  const mode = snapshot.deposit_status === "paid"
    ? "certified"
    : access.isLockedAfterFirstOrder
      ? "required"
      : "optional";

  return (
    <CreatorCertificationHub
      locale={locale}
      creatorId={creator.id}
      snapshot={snapshot}
      mode={mode}
      completedOrders={access.completedOrders}
      submitted={query.submitted === "1"}
      error={errorMessage}
      profileComplete={hasCompletedCreatorProfile(creator)}
    />
  );
}
