import { findCampaignIdByMvpReviewProjectId } from "@/lib/project-service";
import { campaignBridgeService } from "@/features/campaign/campaign-bridge.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { CampaignState } from "@/features/campaign/campaign.state-machine";
import { reviewService } from "@/features/review/review.service";
import { reviewDecisionService } from "@/features/review/review-decision.service";
import { reviewRepository } from "@/features/review/review.repository";
import { getSessionUser } from "@/features/auth/session.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";
import { readProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import type { BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";

function mapMvpAnnotationType(type: string | null): "CIRCLE" | "RECTANGLE" | undefined {
  if (type === "circle") return "CIRCLE";
  if (type === "rect") return "RECTANGLE";
  return undefined;
}

function readLegacyProjectId(campaign: { productionBrief: unknown; id: string }): string | null {
  const brief = readProductionBrief(campaign.productionBrief) as BrandProductionBrief;
  return brief.legacy_project_id ?? campaign.id;
}

export class ReviewBridgeService {
  async resolvePrismaCampaignIdForMvpProject(mvpProjectId: string): Promise<string | null> {
    if (!hasDatabaseUrl()) return null;
    const legacyCampaignId = await findCampaignIdByMvpReviewProjectId(mvpProjectId);
    if (!legacyCampaignId) return null;
    return campaignBridgeService.resolvePrismaCampaignId(legacyCampaignId);
  }

  private async loadLegacyOrder(legacyProjectId: string) {
    const { getOrderForProject } = await import("@/lib/order-service");
    return getOrderForProject(legacyProjectId);
  }

  async syncLegacyOrderStatusAfterUpload(campaignId: string) {
    if (!hasDatabaseUrl()) return;

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) return;

    const legacyProjectId = readLegacyProjectId(campaign);
    if (!legacyProjectId) return;

    try {
      const order = await this.loadLegacyOrder(legacyProjectId);
      if (!order) return;

      const { syncOrderToReviewPhase } = await import("@/lib/order-service");
      await syncOrderToReviewPhase(order.id);
      logger.info("Legacy order synced to review after Prisma upload", {
        service: "ReviewBridgeService",
        campaignId,
        orderId: order.id
      });
    } catch (error) {
      logger.warn("Legacy order sync after upload failed", {
        service: "ReviewBridgeService",
        campaignId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async syncLegacyOrderStatusAfterApprove(campaignId: string) {
    if (!hasDatabaseUrl()) return;

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) return;

    const legacyProjectId = readLegacyProjectId(campaign);
    if (!legacyProjectId) return;

    try {
      const order = await this.loadLegacyOrder(legacyProjectId);
      if (!order) return;

      const { syncOrderToApprovedPhase } = await import("@/lib/order-service");
      await syncOrderToApprovedPhase(order.id);
      logger.info("Legacy order synced to approved after Prisma review approve", {
        service: "ReviewBridgeService",
        campaignId,
        orderId: order.id
      });
    } catch (error) {
      logger.warn("Legacy order sync after approve failed", {
        service: "ReviewBridgeService",
        campaignId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async syncLegacyOrderStatusAfterRevision(campaignId: string) {
    if (!hasDatabaseUrl()) return;

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) return;

    const legacyProjectId = readLegacyProjectId(campaign);
    if (!legacyProjectId) return;

    try {
      const order = await this.loadLegacyOrder(legacyProjectId);
      if (!order) return;

      const { syncOrderToRevisionPhase } = await import("@/lib/order-service");
      await syncOrderToRevisionPhase(order.id);
      logger.info("Legacy order synced to revision after Prisma review revision", {
        service: "ReviewBridgeService",
        campaignId,
        orderId: order.id
      });
    } catch (error) {
      logger.warn("Legacy order sync after revision failed", {
        service: "ReviewBridgeService",
        campaignId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async syncLegacyOrderStatusAfterSelection(campaignId: string, legacyCreatorId: string) {
    if (!hasDatabaseUrl()) return;

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) return;

    const legacyProjectId = readLegacyProjectId(campaign);
    if (!legacyProjectId) return;

    try {
      const { getOrderForProject, syncOrderToInProduction, assignOrderCreator } = await import(
        "@/lib/order-service"
      );
      const order = await getOrderForProject(legacyProjectId);
      if (!order) return;

      let current = order;

      if (order.creator_id !== legacyCreatorId) {
        const updated = await assignOrderCreator({
          orderId: order.id,
          creatorId: legacyCreatorId,
          inquiryId: order.inquiry_id,
          workId: order.work_id
        });
        if (updated) {
          current = updated;
        }
      }

      if (current.payment_status !== "unpaid" && current.status !== "waiting_payment") {
        await syncOrderToInProduction(current.id);
      }
      logger.info("Legacy order synced after Prisma creator selection", {
        service: "ReviewBridgeService",
        campaignId,
        orderId: order.id,
        legacyCreatorId
      });
    } catch (error) {
      logger.warn("Legacy order sync after selection failed", {
        service: "ReviewBridgeService",
        campaignId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async syncLegacyOrderStatusFromCampaign(campaignId: string) {
    if (!hasDatabaseUrl()) return;

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) return;

    if (campaign.status === CampaignState.UNDER_REVIEW) {
      await this.syncLegacyOrderStatusAfterUpload(campaignId);
      return;
    }

    if (campaign.status === CampaignState.APPROVED || campaign.status === CampaignState.MASTER_UPLOADED) {
      await this.syncLegacyOrderStatusAfterApprove(campaignId);
      return;
    }

    if (campaign.status === CampaignState.PRODUCING) {
      await this.syncLegacyOrderStatusAfterRevision(campaignId);
    }
  }

  async createCommentFromMvp(input: {
    mvpProjectId: string;
    versionId: string;
    timeSeconds: number;
    commentText: string;
    annotationType?: string | null;
    posX?: number | null;
    posY?: number | null;
    width?: number | null;
    height?: number | null;
    color?: string | null;
  }) {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id || sessionUser.id.startsWith("demo_")) return null;

    const prismaCampaignId = await this.resolvePrismaCampaignIdForMvpProject(input.mvpProjectId);
    if (!prismaCampaignId) return null;

    const version = await reviewRepository.findVersion(input.versionId);
    if (!version || version.campaignId !== prismaCampaignId) return null;

    const mappedType = mapMvpAnnotationType(input.annotationType ?? null);
    const annotation =
      mappedType &&
      input.posX != null &&
      input.posY != null &&
      input.width != null &&
      input.height != null
        ? {
            type: mappedType,
            x: input.posX,
            y: input.posY,
            width: input.width,
            height: input.height,
            color: input.color ?? undefined
          }
        : undefined;

    return reviewService.createComment({
      campaignId: prismaCampaignId,
      versionId: input.versionId,
      userId: sessionUser.id,
      timeSeconds: input.timeSeconds,
      comment: input.commentText,
      annotation
    });
  }

  private async actorFromSession() {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id || sessionUser.id.startsWith("demo_")) return null;
    return { id: sessionUser.id, role: sessionUser.role };
  }

  async approveFromMvp(mvpProjectId: string) {
    const prismaCampaignId = await this.resolvePrismaCampaignIdForMvpProject(mvpProjectId);
    const actor = await this.actorFromSession();
    if (!prismaCampaignId || !actor) return false;

    const versionId = await reviewDecisionService.getLatestReviewingVersionId(prismaCampaignId);
    if (!versionId) return false;

    await reviewDecisionService.approveVersion(versionId, actor);
    await this.syncLegacyOrderStatusAfterApprove(prismaCampaignId);
    return true;
  }

  async requestRevisionFromMvp(mvpProjectId: string, note?: string) {
    const prismaCampaignId = await this.resolvePrismaCampaignIdForMvpProject(mvpProjectId);
    const actor = await this.actorFromSession();
    if (!prismaCampaignId || !actor) return false;

    const versionId = await reviewDecisionService.getLatestReviewingVersionId(prismaCampaignId);
    if (!versionId) return false;

    await reviewDecisionService.requestRevision(versionId, actor, note);
    await this.syncLegacyOrderStatusAfterRevision(prismaCampaignId);
    return true;
  }
}

export const reviewBridgeService = new ReviewBridgeService();
