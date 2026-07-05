import { activityService } from "@/features/campaign/activity.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import { deliveryRepository } from "@/features/delivery/delivery.repository";
import { versionRepository } from "@/features/delivery/version.repository";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { notificationService } from "@/features/notification/notification.service";
import { userRepository } from "@/features/auth/user.repository";
import { getAppBaseUrl } from "@/lib/app-url";
import { getOrder } from "@/lib/order-service";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";
import { readProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import type { BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";

export type CampaignDeliveryView = {
  id: string;
  campaignId: string;
  versionId: string;
  versionNumber: number;
  downloadUrl: string;
  deliveredAt: string;
  acceptedAt: string | null;
  status: "READY" | "LOCKED";
};

function resolveLegacyProjectId(campaign: { productionBrief: unknown; id: string }): string {
  const brief = readProductionBrief(campaign.productionBrief) as BrandProductionBrief;
  return brief.legacy_project_id ?? campaign.id;
}

function mapDeliveryView(
  row: NonNullable<Awaited<ReturnType<typeof deliveryRepository.findByCampaignIdWithVersion>>>
): CampaignDeliveryView {
  return {
    id: row.id,
    campaignId: row.campaignId,
    versionId: row.versionId,
    versionNumber: row.version.versionNumber,
    downloadUrl: row.downloadUrl,
    deliveredAt: row.deliveredAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    status: row.status
  };
}

export class DeliveryService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  async getForLegacyProject(legacyProjectId: string): Promise<CampaignDeliveryView | null> {
    if (!this.isEnabled()) return null;

    const campaign = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaign) return null;

    const row = await deliveryRepository.findByCampaignIdWithVersion(campaign.id);
    return row ? mapDeliveryView(row) : null;
  }

  async markAsFinalForLegacyOrder(input: {
    legacyProjectId: string;
    orderId: string;
    legacyCreatorId: string;
    versionNumber: number;
    locale: Locale;
  }): Promise<{ ok: true; delivery: CampaignDeliveryView } | { ok: false; error: string }> {
    if (!this.isEnabled()) {
      return { ok: false, error: "no-database" };
    }

    const campaign = await campaignRepository.findByLegacyProjectId(input.legacyProjectId);
    if (!campaign?.creatorId) {
      return { ok: false, error: "unauthorized" };
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

    if (campaign.status !== CampaignState.APPROVED && campaign.status !== CampaignState.MASTER_UPLOADED) {
      return { ok: false, error: "invalid-status" };
    }

    const existing = await deliveryRepository.findByCampaignId(campaign.id);
    if (existing) {
      const row = await deliveryRepository.findByCampaignIdWithVersion(campaign.id);
      if (row) {
        return { ok: true, delivery: mapDeliveryView(row) };
      }
      return { ok: false, error: "delivery-exists" };
    }

    const version = await versionRepository.findByCampaignAndVersionNumber(
      campaign.id,
      input.versionNumber
    );
    if (!version?.videoUrl) {
      return { ok: false, error: "version-not-found" };
    }

    if (!["APPROVED", "READY", "REVIEWING"].includes(version.reviewStatus)) {
      return { ok: false, error: "version-not-approved" };
    }

    const creatorUser = await userRepository.findById(campaign.creatorId);
    if (!creatorUser) {
      return { ok: false, error: "unauthorized" };
    }

    const delivery = await deliveryRepository.create({
      campaignId: campaign.id,
      versionId: version.id,
      downloadUrl: version.videoUrl
    });

    await prisma.campaignVersion.update({
      where: { id: version.id },
      data: { status: "MASTER", reviewStatus: "LOCKED" }
    });

    if (campaign.status === CampaignState.APPROVED) {
      await campaignService.transition(campaign.id, CampaignEvent.MASTER_UPLOAD, {
        id: creatorUser.id,
        role: creatorUser.role
      });
    }

    await activityService.write(
      campaign.id,
      "delivery.marked_final",
      {
        userId: creatorUser.id,
        email: creatorUser.email,
        role: "creator"
      },
      {
        legacy_project_id: input.legacyProjectId,
        order_id: input.orderId,
        version_number: input.versionNumber,
        version_id: version.id,
        delivery_id: delivery.id
      }
    );

    const legacyProjectId = resolveLegacyProjectId(campaign);
    await notificationService
      .notify({
        userId: campaign.brandId,
        campaignId: campaign.id,
        title: input.locale === "zh" ? "最终成片已交付" : "Final delivery is ready",
        content:
          input.locale === "zh"
            ? `「${campaign.title}」Version ${input.versionNumber} 已标记为最终版，可以下载。`
            : `"${campaign.title}" — Version ${input.versionNumber} is marked final and ready to download.`,
        actionUrl: `${getAppBaseUrl()}/brand/projects/${legacyProjectId}/review`,
        email: false
      })
      .catch(() => undefined);

    const order = await getOrder(input.orderId);
    if (order) {
      const { notifyBrandFinalDownloadReady } = await import(
        "@/lib/studioos/commercial-interaction-notify"
      );
      await notifyBrandFinalDownloadReady({ order, locale: input.locale }).catch(() => undefined);
    }

    const row = await deliveryRepository.findByCampaignIdWithVersion(campaign.id);
    if (!row) {
      return { ok: false, error: "delivery-create-failed" };
    }

    return { ok: true, delivery: mapDeliveryView(row) };
  }

  async recordBrandDownload(input: {
    legacyProjectId: string;
    brandEmail: string;
    locale: Locale;
  }): Promise<{ ok: true; delivery: CampaignDeliveryView } | { ok: false; error: string }> {
    if (!this.isEnabled()) {
      return { ok: false, error: "no-database" };
    }

    const campaign = await campaignRepository.findByLegacyProjectId(input.legacyProjectId);
    if (!campaign) {
      return { ok: false, error: "not-found" };
    }

    const brandUser = await userRepository.ensureBrandPortalUser({
      email: input.brandEmail,
      fullName: input.brandEmail.split("@")[0],
      companyName: input.brandEmail.split("@")[0]
    });
    if (!brandUser || brandUser.id !== campaign.brandId) {
      return { ok: false, error: "unauthorized" };
    }

    const row = await deliveryRepository.findByCampaignIdWithVersion(campaign.id);
    if (!row) {
      return { ok: false, error: "not-ready" };
    }

    if (row.status === "LOCKED") {
      return { ok: true, delivery: mapDeliveryView(row) };
    }

    await deliveryRepository.lockAfterDownload(campaign.id);

    await activityService.write(
      campaign.id,
      "delivery.downloaded",
      {
        userId: brandUser.id,
        email: input.brandEmail,
        role: "brand"
      },
      {
        legacy_project_id: input.legacyProjectId,
        delivery_id: row.id,
        version_number: row.version.versionNumber
      }
    );

    if (campaign.creatorId) {
      await notificationService
        .notify({
          userId: campaign.creatorId,
          campaignId: campaign.id,
          title: input.locale === "zh" ? "品牌已下载成片" : "Brand downloaded final delivery",
          content:
            input.locale === "zh"
              ? `「${campaign.title}」最终版已被品牌下载，交付已锁定，等待结算。`
              : `"${campaign.title}" final delivery was downloaded by the brand. Delivery is locked — awaiting settlement.`,
          actionUrl: `${getAppBaseUrl()}/studio/projects`,
          email: false
        })
        .catch(() => undefined);
    }

    const updated = await deliveryRepository.findByCampaignIdWithVersion(campaign.id);
    if (!updated) {
      return { ok: false, error: "not-found" };
    }

    return { ok: true, delivery: mapDeliveryView(updated) };
  }
}

export const deliveryService = new DeliveryService();
