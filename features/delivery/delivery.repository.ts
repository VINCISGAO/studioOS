import type { CampaignDelivery, DeliveryStatus } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class DeliveryRepository {
  async findByCampaignId(campaignId: string): Promise<CampaignDelivery | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaignDelivery.findUnique({ where: { campaignId } });
  }

  async findByCampaignIdWithVersion(campaignId: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaignDelivery.findUnique({
      where: { campaignId },
      include: {
        version: true,
        campaign: { select: { id: true, title: true, brandId: true, creatorId: true, status: true } }
      }
    });
  }

  async create(input: {
    campaignId: string;
    versionId: string;
    downloadUrl: string;
  }): Promise<CampaignDelivery> {
    return prisma.campaignDelivery.create({
      data: {
        campaignId: input.campaignId,
        versionId: input.versionId,
        downloadUrl: input.downloadUrl,
        status: "READY"
      }
    });
  }

  async lockAfterDownload(campaignId: string, acceptedAt: Date = new Date()) {
    return prisma.campaignDelivery.update({
      where: { campaignId },
      data: {
        acceptedAt,
        status: "LOCKED" as DeliveryStatus
      }
    });
  }
}

export const deliveryRepository = new DeliveryRepository();
