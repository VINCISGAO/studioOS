import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { CreatorInvitationsBoard } from "@/components/studioos/creator-invitations-board";
import { CreatorInvitationsProgress } from "@/components/studioos/creator-invitations-progress";
import { getCurrentCreator } from "@/features/auth/session-context";
import { enrichInvitationsForCards } from "@/lib/studioos/creator-invitation-display";
import { listInvitationsForCreator } from "@/lib/studioos/creator-invitation-store";
import { resolveThumbnailsByProjectId } from "@/lib/studioos/resolve-project-thumbnails";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { listOrdersForCreator } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { resolveCreatorCommercialStep } from "@/lib/studioos/commercial-lifecycle";

export default async function StudioInvitationsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams & { tab?: string }>;
}) {
  const locale = await getAppUiLocale();
  const query = await searchParams;
  const creator = await getCurrentCreator();
  if (!creator) redirect(withLocale("/login?role=creator", locale));

  const invitations = await listInvitationsForCreator(creator.id);
  const displayInvitations = invitations;
  const orders = await listOrdersForCreator(creator.id);
  const orderByProjectId = Object.fromEntries(
    orders.filter((order) => order.project_id).map((order) => [order.project_id as string, order.id])
  );

  const projectIds = [...new Set(displayInvitations.map((item) => item.campaignId))];
  const [projects, thumbnailByProjectId] = await Promise.all([
    Promise.all(projectIds.map((id) => getProject(id))),
    resolveThumbnailsByProjectId(projectIds)
  ]);
  const projectsById = Object.fromEntries(projectIds.map((id, index) => [id, projects[index] ?? null]));
  const cardInvitations = enrichInvitationsForCards(
    displayInvitations,
    projectsById,
    locale,
    thumbnailByProjectId
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
      <CreatorInvitationsProgress locale={locale} currentStep={creatorCommercialStep} />
      <CreatorInvitationsBoard
        locale={locale}
        invitations={cardInvitations}
        orderByProjectId={orderByProjectId}
        initialTab={initialTab}
      />
    </div>
  );
}
