import { findCampaignIdByMvpReviewProjectId } from "@/lib/project-service";
import { campaignBridgeService } from "@/features/campaign/campaign-bridge.service";
import { reviewService } from "@/features/review/review.service";
import { reviewDecisionService } from "@/features/review/review-decision.service";
import { reviewRepository } from "@/features/review/review.repository";
import { getSessionUser } from "@/features/auth/session.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

function mapMvpAnnotationType(type: string | null): "CIRCLE" | "RECTANGLE" | undefined {
  if (type === "circle") return "CIRCLE";
  if (type === "rect") return "RECTANGLE";
  return undefined;
}

export class ReviewBridgeService {
  async resolvePrismaCampaignIdForMvpProject(mvpProjectId: string): Promise<string | null> {
    if (!hasDatabaseUrl()) return null;
    const legacyCampaignId = await findCampaignIdByMvpReviewProjectId(mvpProjectId);
    if (!legacyCampaignId) return null;
    return campaignBridgeService.resolvePrismaCampaignId(legacyCampaignId);
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
    return true;
  }

  async requestRevisionFromMvp(mvpProjectId: string, note?: string) {
    const prismaCampaignId = await this.resolvePrismaCampaignIdForMvpProject(mvpProjectId);
    const actor = await this.actorFromSession();
    if (!prismaCampaignId || !actor) return false;

    const versionId = await reviewDecisionService.getLatestReviewingVersionId(prismaCampaignId);
    if (!versionId) return false;

    await reviewDecisionService.requestRevision(versionId, actor, note);
    return true;
  }
}

export const reviewBridgeService = new ReviewBridgeService();
