import { creatorPortalRepository } from "@/features/creator/creator-portal.repository";
import type {
  CreatorPortalDashboard,
  CreatorPortalInvitationView,
  CreatorPortalCampaignView
} from "@/features/creator/creator-portal.types";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { StoredOrder } from "@/lib/order-types";

function readLegacyProjectId(brief: unknown): string | null {
  if (!brief || typeof brief !== "object") return null;
  const record = brief as Record<string, unknown>;
  const legacy = record.legacy_project_id;
  return typeof legacy === "string" ? legacy : null;
}

function mapInvitation(
  row: Awaited<ReturnType<typeof creatorPortalRepository.listPendingInvitations>>[number]
): CreatorPortalInvitationView {
  const brandName =
    row.campaign.brand.brandProfile?.companyName ?? row.campaign.brand.fullName ?? "Brand";
  return {
    id: row.id,
    campaignId: row.campaignId,
    title: row.campaign.title,
    brandName,
    budget: Number(row.campaign.budget),
    currency: row.campaign.currency,
    deadline: row.campaign.deadline.toISOString(),
    platform: row.campaign.platform,
    matchScore: Number(row.matchScore),
    status: row.status,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString()
  };
}

function mapCampaign(
  row: Awaited<ReturnType<typeof creatorPortalRepository.listActiveCampaigns>>[number]
): CreatorPortalCampaignView {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    budget: Number(row.budget),
    currency: row.currency,
    deadline: row.deadline.toISOString(),
    platform: row.platform,
    reviewRound: row.reviewRound,
    legacyProjectId: readLegacyProjectId(row.productionBrief)
  };
}

export class CreatorPortalService {
  private assertCreator(user: AuthUser) {
    if (user.role.toUpperCase() !== "CREATOR" && user.role.toUpperCase() !== "ADMIN") {
      throw appError("FORBIDDEN", "Creator access only");
    }
  }

  async getDashboard(user: AuthUser, orders: StoredOrder[]): Promise<CreatorPortalDashboard> {
    this.assertCreator(user);

    const activeOrders = orders.filter((o) => !["completed", "cancelled"].includes(o.status));
    const inReview = orders.filter((o) => o.status === "review" || o.status === "revision");
    const completed = orders.filter((o) => o.status === "completed");
    const revenue = orders
      .filter((o) => ["held", "approved", "paid"].includes(o.payout_status))
      .reduce((sum, o) => sum + o.creator_payout, 0);

    if (!hasDatabaseUrl()) {
      return {
        invitations: [],
        campaigns: [],
        stats: {
          pendingInvitations: 0,
          activeOrders: activeOrders.length,
          inReview: inReview.length,
          completed: completed.length,
          revenue
        }
      };
    }

    const profile = await creatorPortalRepository.findCreatorProfileByUserId(user.id);
    const [invitationRows, campaignRows] = await Promise.all([
      profile ? creatorPortalRepository.listPendingInvitations(profile.id) : Promise.resolve([]),
      creatorPortalRepository.listActiveCampaigns(user.id)
    ]);

    const invitations = invitationRows.map(mapInvitation);
    const campaigns = campaignRows.map(mapCampaign);

    return {
      invitations,
      campaigns,
      stats: {
        pendingInvitations: invitations.length,
        activeOrders: activeOrders.length,
        inReview: inReview.length,
        completed: completed.length,
        revenue
      }
    };
  }

  async listInvitations(user: AuthUser): Promise<CreatorPortalInvitationView[]> {
    this.assertCreator(user);
    PermissionService.assert(user, "creator.accept");

    if (!hasDatabaseUrl()) return [];

    const profile = await creatorPortalRepository.findCreatorProfileByUserId(user.id);
    if (!profile) return [];

    const rows = await creatorPortalRepository.listPendingInvitations(profile.id);
    return rows.map(mapInvitation);
  }
}

export const creatorPortalService = new CreatorPortalService();
