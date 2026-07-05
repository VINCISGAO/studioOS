import { activityService } from "@/features/campaign/activity.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { CampaignState } from "@/features/campaign/campaign.state-machine";
import {
  MAX_CAMPAIGN_VERSIONS,
  versionRepository
} from "@/features/delivery/version.repository";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { userRepository } from "@/features/auth/user.repository";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";
import type { OrderStatus, StoredDeliverable } from "@/lib/order-types";
import { notificationService } from "@/features/notification/notification.service";
import { getAppBaseUrl } from "@/lib/app-url";
import { resolveReviewUploadVersionForOrder } from "@/lib/studioos/review-upload-version";
import {
  findReviewVideoFile,
  findReviewVideoObject,
  reviewVideoObjectKey
} from "@/lib/studioos/video-upload";

const UPLOADABLE_CAMPAIGN_STATUSES = new Set<string>([
  CampaignState.ESCROW_FUNDED,
  CampaignState.PRODUCING,
  CampaignState.UNDER_REVIEW
]);

export type VersionUploadInput = {
  legacyProjectId: string;
  orderId: string;
  legacyCreatorId: string;
  videoUrl: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  notes?: string;
  notesForClient?: string;
  notesClientLocale?: Locale;
  locale: Locale;
  /** When set (e.g. after /api/delivery/upload-video), must match the on-disk review file slot. */
  versionNumber?: number;
  replaceExisting?: boolean;
  orderStatus?: OrderStatus;
  paidRevisionSlotsUnlocked?: number;
};

function deriveFileKey(orderId: string, versionNumber: number, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `review/${orderId}/v${versionNumber}/${safeName}`;
}

async function resolveReviewVideoSource(input: {
  orderId: string;
  versionNumber: number;
  fileName: string;
  videoKey: string;
}) {
  const object = await findReviewVideoObject(input.orderId, input.versionNumber);
  if (object) {
    return {
      videoKey: object.key,
      sourceObjectKey: object.key,
      sourcePath: null as string | null,
      mimeType: object.contentType,
      fileSizeBytes: object.contentLength
    };
  }

  const file = await findReviewVideoFile(input.orderId, input.versionNumber);
  if (file) {
    const extension = file.extension === "mov" ? "mov" : "mp4";
    return {
      videoKey: reviewVideoObjectKey(input.orderId, input.versionNumber, extension),
      sourceObjectKey: null as string | null,
      sourcePath: file.path,
      mimeType: file.contentType,
      fileSizeBytes: null as number | null
    };
  }

  return {
    videoKey: input.videoKey,
    sourceObjectKey: null as string | null,
    sourcePath: null as string | null,
    mimeType: null as string | null,
    fileSizeBytes: null as number | null
  };
}

function inferUploadMeta(input: {
  orderId: string;
  versionNumber: number;
  videoUrl: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
}) {
  const reviewPath = `/api/review-video/${input.orderId}/${input.versionNumber}`;
  const isLocalReview = input.videoUrl.includes(reviewPath) || input.videoUrl.endsWith(reviewPath);

  return {
    fileName: input.fileName?.trim() || (isLocalReview ? `v${input.versionNumber}.mp4` : "review.mp4"),
    mimeType: input.mimeType?.trim() || "video/mp4",
    fileSizeBytes: input.fileSizeBytes ?? null
  };
}

function mapVersionToDeliverable(
  version: Awaited<ReturnType<typeof versionRepository.createVersion>>,
  orderId: string,
  notes?: string,
  notesForClient?: string,
  notesClientLocale?: Locale
): StoredDeliverable {
  const videoUrl = version.videoUrl?.trim() ?? "";
  return {
    id: version.id,
    order_id: orderId,
    file_url: videoUrl,
    thumbnail_url: version.thumbnailUrl ?? videoUrl,
    notes: notes ?? "",
    notes_for_client: notesForClient ?? notes ?? "",
    notes_client_locale: notesClientLocale,
    version: version.versionNumber,
    created_at: version.createdAt.toISOString()
  };
}

export class VersionService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  async listDeliverablesForLegacyProject(
    legacyProjectId: string,
    orderId: string
  ): Promise<StoredDeliverable[] | null> {
    if (!this.isEnabled()) return null;

    const campaign = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaign) return null;

    const versions = await versionRepository.listByCampaign(campaign.id);
    return versions.map((version) => mapVersionToDeliverable(version, orderId));
  }

  async uploadForLegacyOrder(
    input: VersionUploadInput
  ): Promise<
    | { ok: true; deliverable: StoredDeliverable; translated: boolean }
    | { ok: false; error: string }
  > {
    if (!this.isEnabled()) {
      return { ok: false, error: "no-database" };
    }

    const campaign = await campaignRepository.findByLegacyProjectId(input.legacyProjectId);
    if (!campaign) {
      return { ok: false, error: "project-not-found" };
    }

    if (!campaign.creatorId) {
      return { ok: false, error: "creator-not-assigned" };
    }

    const creatorProfileId = await resolveCreatorProfileIdForLegacyId(input.legacyCreatorId);
    if (!creatorProfileId) {
      return { ok: false, error: "unauthorized" };
    }

    const profile = await prisma.creatorProfile.findUnique({
      where: { id: creatorProfileId },
      select: { userId: true }
    });
    if (!profile || profile.userId !== campaign.creatorId) {
      return { ok: false, error: "unauthorized" };
    }

    if (!UPLOADABLE_CAMPAIGN_STATUSES.has(campaign.status)) {
      return { ok: false, error: "invalid-status" };
    }

    const existingDeliverables =
      (await this.listDeliverablesForLegacyProject(input.legacyProjectId, input.orderId)) ?? [];
    const uploadTarget =
      input.versionNumber != null && input.replaceExisting != null
        ? { version: input.versionNumber, replace: input.replaceExisting }
        : await resolveReviewUploadVersionForOrder(
            input.orderId,
            existingDeliverables,
            input.orderStatus ?? "in_production",
            input.paidRevisionSlotsUnlocked ?? 0
          );
    const { version: versionNumber, replace } = uploadTarget;

    if (!replace) {
      const existingCount = await versionRepository.countByCampaign(campaign.id);
      if (existingCount >= MAX_CAMPAIGN_VERSIONS) {
        return { ok: false, error: "max-versions" };
      }
    }

    const meta = inferUploadMeta({
      orderId: input.orderId,
      versionNumber,
      videoUrl: input.videoUrl,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes
    });
    const inferredVideoKey = deriveFileKey(input.orderId, versionNumber, meta.fileName);
    const source = await resolveReviewVideoSource({
      orderId: input.orderId,
      versionNumber,
      fileName: meta.fileName,
      videoKey: inferredVideoKey
    });
    const videoKey = source.videoKey;

    const creatorUser = await userRepository.findById(campaign.creatorId);
    if (!creatorUser) {
      return { ok: false, error: "unauthorized" };
    }

    const existingVersion = await versionRepository.findByCampaignAndVersionNumber(campaign.id, versionNumber);
    const shouldUpdateExisting = replace || Boolean(existingVersion);

    const version = shouldUpdateExisting
      ? await versionRepository.updateVersionMedia({
          campaignId: campaign.id,
          versionNumber,
          videoKey,
          videoUrl: input.videoUrl,
          fileName: meta.fileName,
          mimeType: source.mimeType ?? meta.mimeType,
          fileSizeBytes: source.fileSizeBytes ?? meta.fileSizeBytes,
          notes: input.notes?.trim() || null
        })
      : await versionRepository.createVersion({
          campaignId: campaign.id,
          versionNumber,
          uploadedBy: campaign.creatorId,
          videoKey,
          videoUrl: input.videoUrl,
          fileName: meta.fileName,
          mimeType: source.mimeType ?? meta.mimeType,
          fileSizeBytes: source.fileSizeBytes ?? meta.fileSizeBytes,
          notes: input.notes?.trim() || null
        });

    if (!version) {
      return { ok: false, error: "project-not-found" };
    }

    if (!replace) {
      await campaignRepository.setCurrentVersion(campaign.id, versionNumber);
    }

    await activityService.write(
      campaign.id,
      "version.upload_processing",
      {
        userId: creatorUser.id,
        email: creatorUser.email,
        role: "creator"
      },
      {
        legacy_project_id: input.legacyProjectId,
        order_id: input.orderId,
        version_number: versionNumber,
        video_url: input.videoUrl,
        video_key: videoKey,
        source_object_key: source.sourceObjectKey,
        source_path: source.sourcePath,
        file_name: meta.fileName,
        mime_type: source.mimeType ?? meta.mimeType,
        file_size_bytes: source.fileSizeBytes ?? meta.fileSizeBytes,
        notes: input.notes?.trim() || null
      }
    );

    const { videoWorkerService } = await import("@/features/video/video-worker.service");
    const job = await videoWorkerService.enqueueTranscode({
      campaignId: campaign.id,
      versionId: version.id,
      videoUrl: input.videoUrl,
      watermark: true,
      sourceObjectKey: source.sourceObjectKey,
      sourcePath: source.sourcePath,
      legacyOrderId: input.orderId,
      legacyProjectId: input.legacyProjectId,
      legacyCreatorId: input.legacyCreatorId,
      locale: input.locale
    });
    videoWorkerService.scheduleProcess(job.id);

    const deliverable = mapVersionToDeliverable(
      version,
      input.orderId,
      input.notes,
      input.notesForClient,
      input.notesClientLocale
    );

    const { upsertJsonDeliverable } = await import("@/lib/order-service");
    await upsertJsonDeliverable(input.orderId, deliverable);

    await notificationService
      .notify({
        userId: campaign.brandId,
        campaignId: campaign.id,
        title: input.locale === "zh" ? `创作者已上传 V${versionNumber}` : `Creator uploaded V${versionNumber}`,
        content:
          input.locale === "zh"
            ? `「${campaign.title}」V${versionNumber} 已上传，请进入审片中心审核。`
            : `"${campaign.title}" V${versionNumber} is ready for brand review.`,
        actionUrl: `${getAppBaseUrl()}/studio/review/${input.orderId}`,
        email: false
      })
      .catch(() => undefined);

    return {
      ok: true,
      deliverable,
      translated: Boolean(input.notes && input.notesForClient && input.notes !== input.notesForClient)
    };
  }
}

export const versionService = new VersionService();
