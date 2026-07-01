import { brandPortalRepository } from "@/features/brand/brand-portal.repository";
import type {
  BrandPortalCampaignView,
  BrandPortalDashboard,
  BrandPortalEscrowView,
  BrandPortalStats
} from "@/features/brand/brand-portal.types";
import type { AuthUser } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";

function readLegacyProjectId(brief: unknown): string | null {
  if (!brief || typeof brief !== "object") return null;
  const legacy = (brief as Record<string, unknown>).legacy_project_id;
  return typeof legacy === "string" ? legacy : null;
}

function mapCampaign(
  row: Awaited<ReturnType<typeof brandPortalRepository.listCampaignsForBrand>>[number]
): BrandPortalCampaignView {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    budget: Number(row.budget),
    currency: row.currency,
    deadline: row.deadline.toISOString(),
    creatorId: row.creatorId,
    reviewRound: row.reviewRound,
    legacyProjectId: readLegacyProjectId(row.productionBrief)
  };
}

function mapEscrow(
  row: Awaited<ReturnType<typeof brandPortalRepository.listEscrowsForBrand>>[number]
): BrandPortalEscrowView {
  return {
    campaignId: row.campaignId,
    campaignTitle: row.campaign.title,
    legacyProjectId: readLegacyProjectId(row.campaign.productionBrief),
    status: row.status,
    amount: Number(row.amount),
    releasedAmount: Number(row.releasedAmount),
    remainingAmount: Number(row.remainingAmount),
    currency: row.currency,
    creatorId: row.creatorId
  };
}

function computeLegacyStats(orders: StoredOrder[], projects: StoredProject[]): BrandPortalStats {
  const rows = [...projects, ...orders];
  const draftCount = projects.filter((p) => normalizeCampaignStatus(p.status) === "draft").length;
  const activeCount = rows.filter((item) => {
    const status = "status" in item ? item.status : "";
    return !["completed", "cancelled", "delivered"].includes(normalizeCampaignStatus(status));
  }).length;
  const awaitingReview = [
    ...projects.filter((p) => normalizeCampaignStatus(p.status) === "in_review"),
    ...orders.filter((o) => o.status === "review" || o.status === "revision")
  ].length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthSpend = orders
    .filter((o) => o.payment_status !== "unpaid" && o.paid_at && new Date(o.paid_at) >= monthStart)
    .reduce((sum, o) => sum + o.amount, 0);

  return {
    totalProjects: projects.length + orders.filter((o) => !o.project_id).length,
    draftCount,
    activeCount,
    awaitingReview,
    escrowHeld: 0,
    monthSpend
  };
}

export class BrandPortalService {
  private assertBrand(user: AuthUser) {
    if (user.role.toUpperCase() !== "BRAND" && user.role.toUpperCase() !== "ADMIN") {
      throw appError("FORBIDDEN", "Brand access only");
    }
  }

  async getDashboard(
    user: AuthUser,
    orders: StoredOrder[],
    projects: StoredProject[]
  ): Promise<BrandPortalDashboard> {
    this.assertBrand(user);

    const baseStats = computeLegacyStats(orders, projects);

    if (!hasDatabaseUrl()) {
      return { campaigns: [], escrows: [], stats: baseStats };
    }

    const [campaignRows, escrowRows] = await Promise.all([
      brandPortalRepository.listCampaignsForBrand(user.id),
      brandPortalRepository.listEscrowsForBrand(user.id)
    ]);

    const campaigns = campaignRows.map(mapCampaign);
    const escrows = escrowRows.map(mapEscrow);
    const escrowHeld = escrows.filter((e) => e.status === "HELD" || e.status === "PARTIAL_RELEASE").length;

    return {
      campaigns,
      escrows,
      stats: {
        ...baseStats,
        escrowHeld,
        awaitingReview: Math.max(
          baseStats.awaitingReview,
          campaigns.filter((c) => ["UNDER_REVIEW", "APPROVED"].includes(c.status)).length
        )
      }
    };
  }

  async listReviewItems(user: AuthUser) {
    this.assertBrand(user);
    if (!hasDatabaseUrl()) return [];
    const rows = await brandPortalRepository.listReviewReadyCampaigns(user.id);
    return rows.map(mapCampaign);
  }

  async listSettlementItems(user: AuthUser) {
    this.assertBrand(user);
    if (!hasDatabaseUrl()) return [];
    const rows = await brandPortalRepository.listEscrowsForBrand(user.id);
    return rows.map(mapEscrow);
  }
}

export const brandPortalService = new BrandPortalService();
