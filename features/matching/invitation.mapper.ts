import type { Campaign, CreatorInvitation, InvitationStatus, User } from "@prisma/client";
import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import type { BrandCampaignMemory } from "@/features/campaign/brand-campaign/brand-campaign.types";
import { parseInvitationDeclineFeedback } from "@/features/matching/invitation-decline-feedback";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { readProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.utils";

type InvitationWithCampaign = CreatorInvitation & {
  campaign: Campaign & {
    brand?: User & { brandProfile?: { companyName: string } | null };
  };
  creator?: { userId: string; displayName: string; user?: User };
};

export function prismaInvitationStatusToPortal(status: InvitationStatus): string {
  if (status === "SENT" || status === "VIEWED") return "pending";
  if (status === "ACCEPTED") return "accepted";
  if (status === "DECLINED") return "declined";
  if (status === "EXPIRED") return "expired";
  return "pending";
}

export function resolvePortalInvitationStatus(
  prismaStatus: InvitationStatus,
  legacyCreatorId: string,
  selection?: BrandCampaignMemory["selection"]
): string {
  const base = prismaInvitationStatusToPortal(prismaStatus);
  if (!selection?.legacy_creator_id) {
    return base;
  }
  if (selection.legacy_creator_id === legacyCreatorId && prismaStatus === "ACCEPTED") {
    return "selected";
  }
  if (
    selection.legacy_creator_id !== legacyCreatorId &&
    (prismaStatus === "EXPIRED" || base === "accepted")
  ) {
    return "expired";
  }
  return base;
}

export function portalInvitationStatusToPrismaRespondable(status: string): InvitationStatus[] {
  if (status === "pending") return ["SENT", "VIEWED"];
  return [];
}

export function resolveLegacyProjectId(campaign: Campaign): string {
  const brief = readProductionBrief(campaign.productionBrief) as { legacy_project_id?: string };
  const legacy = brief.legacy_project_id;
  return typeof legacy === "string" && legacy.trim() ? legacy : campaign.id;
}

export function mapInvitationToStored(
  invitation: InvitationWithCampaign,
  legacyProjectId: string,
  legacyCreatorId: string,
  selection?: BrandCampaignMemory["selection"]
): StoredCreatorInvitation {
  const campaign = invitation.campaign;
  const feedback = parseInvitationDeclineFeedback(
    (invitation as { declineFeedbackJson?: unknown }).declineFeedbackJson
  );
  const brandName =
    campaign.brand?.brandProfile?.companyName ??
    campaign.brand?.fullName ??
    "Brand";

  return {
    id: invitation.id,
    creatorId: legacyCreatorId,
    projectId: legacyProjectId,
    campaignId: legacyProjectId,
    title: campaign.title,
    brandName,
    brandEmail: campaign.brand?.email?.toLowerCase(),
    creatorName: invitation.creator.displayName,
    creatorHeadline: invitation.creator.headline ?? undefined,
    budget: Number(campaign.budget),
    currency: campaign.currency,
    deadline: campaign.deadline.toISOString(),
    platform: campaign.platform,
    matchScore: Number(invitation.matchScore),
    status: resolvePortalInvitationStatus(invitation.status, legacyCreatorId, selection),
    expiresAt: invitation.expiresAt?.toISOString() ?? null,
    createdAt: invitation.createdAt.toISOString(),
    ...(feedback.success ? { declineFeedback: feedback.data } : {})
  };
}

export function mapInvitationToPortalView(
  stored: StoredCreatorInvitation
): CreatorPortalInvitationView {
  const {
    creatorId: _creatorId,
    projectId: _projectId,
    brandEmail: _brandEmail,
    ...view
  } = stored;
  return view;
}
