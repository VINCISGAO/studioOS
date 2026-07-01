import { redirect } from "next/navigation";
import { CreatorInvitationsBoard } from "@/components/studioos/creator-invitations-board";
import { CreatorCommercialTimeline } from "@/components/studioos/commercial-lifecycle-timeline";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { resolveCreatorCommercialStep } from "@/lib/studioos/commercial-lifecycle";
import { listInvitationsForCreator } from "@/lib/studioos/creator-invitation-store";
import { listOrdersForCreator } from "@/lib/order-service";

export default async function StudioInvitationsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams & { tab?: string }>;
}) {
  const locale = getLocale(await searchParams);
  const query = await searchParams;
  const creator = await getCurrentCreator();
  if (!creator) redirect(withLocale("/login?role=creator", locale));

  const invitations = await listInvitationsForCreator(creator.id);
  const orders = await listOrdersForCreator(creator.id);
  const orderByProjectId = Object.fromEntries(
    orders.filter((order) => order.project_id).map((order) => [order.project_id as string, order.id])
  );
  const focusInvitation =
    invitations.find((item) => item.status === "selected") ??
    invitations.find((item) => item.status === "accepted") ??
    invitations.find((item) => item.status === "pending") ??
    invitations.find((item) => item.status === "declined") ??
    null;
  const creatorCommercialStep = resolveCreatorCommercialStep({
    invitationStatus: focusInvitation?.status ?? null
  });

  const validTabs = new Set(["pending", "accepted", "declined", "expired"]);
  const initialTab =
    query.tab && validTabs.has(query.tab)
      ? (query.tab as "pending" | "accepted" | "declined" | "expired")
      : "pending";

  return (
    <div className="space-y-6">
      <CreatorCommercialTimeline locale={locale} currentStep={creatorCommercialStep} compact />
      <CreatorInvitationsBoard
        locale={locale}
        invitations={invitations}
        orderByProjectId={orderByProjectId}
        initialTab={initialTab}
      />
    </div>
  );
}
