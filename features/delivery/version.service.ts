import { activityService } from "@/features/campaign/activity.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import {
  MAX_CAMPAIGN_VERSIONS,
  versionRepository
} from "@/features/delivery/version.repository";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { notificationService } from "@/features/notification/notification.service";
import { userRepository } from "@/features/auth/user.repository";
import { getAppBaseUrl } from "@/lib/app-url";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";
import type { StoredDeliverable } from "@/lib/order-types";
import { readProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import type { BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";

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
};

function resolveLegacyProjectId(campaign: { productionBrief: unknown; id: string }): string {
  const brief = readProductionBrief(campaign.productionBrief) as BrandProductionBrief;
  return brief.legacy_project_id ?? campaign.id;
}

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

function brandReviewCopy(locale: Locale, projectTitle: string, versionNumber: number) {
  if (locale === "zh") {
    if (versionNumber === 1) {
      return {
        title: "Studio 已提交审片版",
        body: `「${projectTitle}」Version 1 已上传，请前往审片页审核。`
      };
    }
    return {
      title: "Studio 已提交新版本",
      body: `「${projectTitle}」Version ${versionNumber} 已提交，请审阅修改版。`
    };
  }

  if (versionNumber === 1) {
    return {
      title: "Studio submitted Version 1 for review",
      body: `"${projectTitle}" — Version 1 is ready. Open the review workspace to approve or request changes.`
    };
  }

  return {
    title: "Studio submitted a new version",
    body: `"${projectTitle}" — Version ${versionNumber} is ready for your review.`
  };
}

function mapVersionToDeliverable(
  version: Awaited<ReturnType<typeof versionRepository.createVersion>>,
  orderId: string,
  notes?: string,
  notesForClient?: string,
  notesClientLocale?: Locale
): StoredDeliverable {
  return {
    id: version.id,
    order_id: orderId,
    file_url: version.videoUrl ?? "",
    thumbnail_url: version.thumbnailUrl ?? version.videoUrl ?? "",
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

    const existingCount = await versionRepository.countByCampaign(campaign.id);
    if (existingCount >= MAX_CAMPAIGN_VERSIONS) {
      return { ok: false, error: "max-versions" };
    }

    const versionNumber = existingCount + 1;
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

    const version = await versionRepository.createVersion({
      campaignId: campaign.id,
      versionNumber,
      uploadedBy: campaign.creatorId,
      videoKey,
      videoUrl: input.videoUrl,
      fileName: meta.fileName,
      mimeType: meta.mimeType,
      fileSizeBytes: meta.fileSizeBytes
    });

    await campaignRepository.setCurrentVersion(campaign.id, versionNumber);

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

    const legacyProjectId = resolveLegacyProjectId(campaign);
    const copy = brandReviewCopy(input.locale, campaign.title, versionNumber);
    await notificationService
      .notify({
        userId: campaign.brandId,
        campaignId: campaign.id,
        title: copy.title,
        content: copy.body,
        actionUrl: `${getAppBaseUrl()}/brand/projects/${legacyProjectId}/review`,
        email: false
      })
      .catch(() => undefined);

    const deliverable = mapVersionToDeliverable(
      version,
      input.orderId,
      input.notes,
      input.notesForClient,
      input.notesClientLocale
    );

    return {
      ok: true,
      deliverable,
      translated: Boolean(input.notes && input.notesForClient && input.notes !== input.notesForClient)
    };
  }
}

export const versionService = new VersionService();
