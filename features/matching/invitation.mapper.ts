import type { Campaign, CreatorInvitation, InvitationStatus, User } from "@prisma/client";
import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
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
  legacyCreatorId: string
): StoredCreatorInvitation {
  const campaign = invitation.campaign;
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
    budget: Number(campaign.budget),
    currency: campaign.currency,
    deadline: campaign.deadline.toISOString(),
    platform: campaign.platform,
    matchScore: Number(invitation.matchScore),
    status: prismaInvitationStatusToPortal(invitation.status),
    expiresAt: invitation.expiresAt?.toISOString() ?? null,
    createdAt: invitation.createdAt.toISOString()
  };
}

export function mapInvitationToPortalView(
  stored: StoredCreatorInvitation
): CreatorPortalInvitationView {
  const { creatorId: _creatorId, projectId: _projectId, brandEmail: _brandEmail, ...view } = stored;
  return view;
}
