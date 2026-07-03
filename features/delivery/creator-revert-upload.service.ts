import { activityService } from "@/features/campaign/activity.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import { versionRepository } from "@/features/delivery/version.repository";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { reviewService } from "@/features/review/review.service";
import { resolveLegacyOrderEffectiveStatus } from "@/features/review/review-portal-ui-state";
import { userRepository } from "@/features/auth/user.repository";
import type { Locale } from "@/lib/i18n";
import type { StoredDeliverable } from "@/lib/order-types";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import {
  getOrder,
  listDeliverablesForUpload,
  removeJsonDeliverableVersion,
  syncOrderToCreatorReuploadPhase,
  syncOrderToReviewPhase,
  upsertJsonDeliverable
} from "@/lib/order-service";
import { listReviewComments } from "@/lib/studioos/review-store";
import {
  canCreatorRevertUpload,
  creatorRevertUploadPolicyNotice
} from "@/lib/studioos/creator-revert-upload-policy";
import { hasBrandNotification } from "@/lib/studioos/brand-notification-service";
import { reviewDraftLabel } from "@/features/review/review-round-policy";
import {
  isUnsubmittedDeliverable,
  latestSubmittedDeliverableVersion,
  prunePhantomReviewDeliverables,
  resolveActiveReviewPlaybackVersion
} from "@/lib/studioos/review-upload-version";
import { deleteReviewVideoSlotFiles } from "@/lib/studioos/video-upload";

export type CreatorRevertUploadResult =
  | { ok: true; message: string; orderStatus: "in_production"; version: number }
  | { ok: false; error: string };

function copy(locale: Locale) {
  if (locale === "zh") {
    return {
      success: (version: number) => `已退回上传，请重新提交${reviewDraftLabel("zh", version)}。`,
      unauthorized: "无权限",
      notFound: "找不到订单",
      invalidStatus: "当前状态不可退回上传",
      brandAlreadyReviewed: creatorRevertUploadPolicyNotice("zh").lockedHint,
      noVersion: "没有可退回的审片版本"
    };
  }
  return {
    success: (version: number) =>
      `Upload reverted. Please submit ${reviewDraftLabel("en", version)} again.`,
    unauthorized: "Unauthorized",
    notFound: "Order not found",
    invalidStatus: "Cannot revert upload in the current status",
    brandAlreadyReviewed: creatorRevertUploadPolicyNotice("en").lockedHint,
    noVersion: "No review version to revert"
  };
}

async function purgeReviewDeliverablesAbove(
  orderId: string,
  projectId: string | null,
  aboveVersion: number
) {
  const deliverables = await listDeliverablesForUpload(orderId);
  for (const item of deliverables) {
    if (item.version <= aboveVersion) continue;
    await deleteReviewVideoSlotFiles(orderId, item.version);
    await removeJsonDeliverableVersion(orderId, item.version);
    if (hasDatabaseUrl() && projectId) {
      const campaign = await campaignRepository.findByLegacyProjectId(projectId);
      if (campaign) {
        await versionRepository.softDeleteVersion({
          campaignId: campaign.id,
          versionNumber: item.version
        });
      }
    }
  }
}

export class CreatorRevertUploadService {
  async resolveRevertGate(input: {
    orderId: string;
    versionNumber: number;
    projectId?: string | null;
  }) {
    const order = await getOrder(input.orderId);
    if (order?.project_id) {
      const reviewRequestSubmitted = await hasBrandNotification({
        brand_email: order.client_email,
        project_id: order.project_id,
        creator_id: order.creator_id,
        type: "deliverable_uploaded",
        order_id: order.id,
        deliverable_version: input.versionNumber
      });
      if (reviewRequestSubmitted) {
        return {
          brandComments: [],
          prismaReviewStatus: null,
          canRevert: false
        };
      }
    }

    const brandComments = (await listReviewComments(input.orderId, input.versionNumber)).filter(
      (item) => item.author === "brand"
    );

    let prismaReviewStatus: string | null = null;
    if (hasDatabaseUrl() && input.projectId) {
      const campaign = await campaignRepository.findByLegacyProjectId(input.projectId);
      if (campaign) {
        const prismaVersion = await versionRepository.findByCampaignAndVersionNumber(
          campaign.id,
          input.versionNumber
        );
        prismaReviewStatus = prismaVersion?.reviewStatus ?? null;
      }
    }

    const gate = { brandComments, prismaReviewStatus };
    return {
      ...gate,
      canRevert: canCreatorRevertUpload(gate)
    };
  }

  async revertForLegacyOrder(input: {
    orderId: string;
    legacyCreatorId: string;
    legacyProjectId?: string | null;
    locale: Locale;
    versionNumber?: number;
  }): Promise<CreatorRevertUploadResult> {
    const t = copy(input.locale);
    const order = await getOrder(input.orderId);
    if (!order || order.creator_id !== input.legacyCreatorId) {
      return { ok: false, error: t.unauthorized };
    }

    const rawDeliverables = await listDeliverablesForUpload(input.orderId);
    const deliverables = await prunePhantomReviewDeliverables(input.orderId, rawDeliverables);
    const submittedVersion = latestSubmittedDeliverableVersion(deliverables);
    const effectiveStatus = await resolveLegacyOrderEffectiveStatus({
      order,
      deliverableCount: submittedVersion > 0 ? submittedVersion : deliverables.length
    });

    if (effectiveStatus !== "review") {
      return { ok: false, error: t.invalidStatus };
    }

    if (order.status !== "review") {
      await syncOrderToReviewPhase(order.id);
    }

    const requestedVersion =
      input.versionNumber != null && Number.isFinite(input.versionNumber) && input.versionNumber > 0
        ? input.versionNumber
        : null;
    const playbackVersion = await resolveActiveReviewPlaybackVersion(input.orderId, deliverables);
    const versionNumber = requestedVersion ?? (submittedVersion || playbackVersion);
    if (versionNumber <= 0) {
      return { ok: false, error: t.noVersion };
    }

    const targetDeliverable = deliverables.find((item) => item.version === versionNumber);
    if (
      !targetDeliverable ||
      isUnsubmittedDeliverable(targetDeliverable) ||
      versionNumber !== submittedVersion
    ) {
      return { ok: false, error: t.noVersion };
    }

    const reviewRequestSubmitted =
      order.project_id &&
      (await hasBrandNotification({
        brand_email: order.client_email,
        project_id: order.project_id,
        creator_id: order.creator_id,
        type: "deliverable_uploaded",
        order_id: order.id,
        deliverable_version: versionNumber
      }));
    if (reviewRequestSubmitted) {
      return { ok: false, error: t.brandAlreadyReviewed };
    }

    const gate = await this.resolveRevertGate({
      orderId: input.orderId,
      versionNumber,
      projectId: order.project_id
    });
    if (!canCreatorRevertUpload(gate)) {
      return { ok: false, error: t.brandAlreadyReviewed };
    }

    await purgeReviewDeliverablesAbove(input.orderId, order.project_id, versionNumber);
    await deleteReviewVideoSlotFiles(input.orderId, versionNumber);

    const existing =
      deliverables.find((item) => item.version === versionNumber) ??
      ({
        id: `del_${input.orderId}_v${versionNumber}`,
        order_id: input.orderId,
        version: versionNumber,
        created_at: new Date().toISOString()
      } satisfies Partial<StoredDeliverable>);

    await upsertJsonDeliverable(input.orderId, {
      id: existing.id ?? `del_${input.orderId}_v${versionNumber}`,
      order_id: input.orderId,
      file_url: "",
      thumbnail_url: "",
      notes: "",
      notes_for_client: "",
      version: versionNumber,
      created_at: existing.created_at ?? new Date().toISOString()
    });

    if (hasDatabaseUrl() && order.project_id) {
      const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
      if (campaign?.creatorId) {
        const creatorProfileId = await resolveCreatorProfileIdForLegacyId(input.legacyCreatorId);
        if (!creatorProfileId) {
          return { ok: false, error: t.unauthorized };
        }

        const profile = await prisma.creatorProfile.findUnique({
          where: { id: creatorProfileId },
          select: { userId: true }
        });
        if (!profile || profile.userId !== campaign.creatorId) {
          return { ok: false, error: t.unauthorized };
        }

        const creatorUser = await userRepository.findById(campaign.creatorId);
        if (!creatorUser) {
          return { ok: false, error: t.unauthorized };
        }

        const prismaVersion = await versionRepository.findByCampaignAndVersionNumber(
          campaign.id,
          versionNumber
        );

        if (campaign.status === CampaignState.PRODUCING && prismaVersion?.reviewStatus === "READY") {
          await campaignService.transition(campaign.id, CampaignEvent.VERSION_UPLOAD, {
            id: creatorUser.id,
            role: "creator"
          });
        }

        if (prismaVersion?.reviewStatus === "READY") {
          await reviewService.changeReviewStatus(
            prismaVersion.id,
            "CREATOR_REVERT",
            campaign.reviewRound,
            {
              id: creatorUser.id,
              role: "creator"
            }
          );
        }

        await versionRepository.resetVersionForCreatorReupload({
          campaignId: campaign.id,
          versionNumber
        });

        await campaignRepository.setCurrentVersion(campaign.id, versionNumber);

        await campaignService.transition(campaign.id, CampaignEvent.CREATOR_REVERT_UPLOAD, {
          id: creatorUser.id,
          role: "creator"
        });

        await activityService.write(
          campaign.id,
          "version.creator_reverted",
          {
            userId: creatorUser.id,
            email: creatorUser.email,
            role: "creator"
          },
          {
            legacy_project_id: order.project_id,
            order_id: input.orderId,
            version_number: versionNumber
          }
        );
      }
    }

    await syncOrderToCreatorReuploadPhase(input.orderId, versionNumber);

    return {
      ok: true,
      message: t.success(versionNumber),
      orderStatus: "in_production",
      version: versionNumber
    };
  }
}

export const creatorRevertUploadService = new CreatorRevertUploadService();
