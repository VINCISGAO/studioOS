import { activityService } from "@/features/campaign/activity.service";
import { reviewBridgeService } from "@/features/review/review-bridge.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import {
  MAX_CAMPAIGN_VERSIONS,
  versionRepository
} from "@/features/delivery/version.repository";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { userRepository } from "@/features/auth/user.repository";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";
import type { OrderStatus, StoredDeliverable } from "@/lib/order-types";
import {
  resolveReviewUploadVersionForOrder,
  reviewVideoUrlForVersion
} from "@/lib/studioos/review-upload-version";

const UPLOADABLE_CAMPAIGN_STATUSES = new Set<string>([
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
    const videoKey = deriveFileKey(input.orderId, versionNumber, meta.fileName);

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
          mimeType: meta.mimeType,
          fileSizeBytes: meta.fileSizeBytes,
          notes: input.notes?.trim() || null
        })
      : await versionRepository.createVersion({
          campaignId: campaign.id,
          versionNumber,
          uploadedBy: campaign.creatorId,
          videoKey,
          videoUrl: input.videoUrl,
          fileName: meta.fileName,
          mimeType: meta.mimeType,
          fileSizeBytes: meta.fileSizeBytes,
          notes: input.notes?.trim() || null
        });

    if (!version) {
      return { ok: false, error: "project-not-found" };
    }

    if (!replace) {
      await campaignRepository.setCurrentVersion(campaign.id, versionNumber);
    }

    await campaignService.transition(campaign.id, CampaignEvent.VERSION_UPLOAD, {
      id: creatorUser.id,
      role: creatorUser.role
    });

    await activityService.write(
      campaign.id,
      "version.uploaded",
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
        file_name: meta.fileName,
        mime_type: meta.mimeType,
        file_size_bytes: meta.fileSizeBytes,
        notes: input.notes?.trim() || null
      }
    );

    await reviewBridgeService.syncLegacyOrderStatusAfterUpload(campaign.id);

    const deliverable = mapVersionToDeliverable(
      version,
      input.orderId,
      input.notes,
      input.notesForClient,
      input.notesClientLocale
    );

    const { upsertJsonDeliverable } = await import("@/lib/order-service");
    await upsertJsonDeliverable(input.orderId, deliverable);

    return {
      ok: true,
      deliverable,
      translated: Boolean(input.notes && input.notesForClient && input.notes !== input.notesForClient)
    };
  }
}

export const versionService = new VersionService();
