import type { AssetType, Campaign, CampaignAsset, CampaignStatus, Prisma } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export type CampaignWithAssets = Prisma.CampaignGetPayload<{ include: { assets: true } }>;

export type CampaignWithRelations = Prisma.CampaignGetPayload<{
  include: {
    versions: { include: { comments: { include: { annotations: true; user: true } } } };
    brand: { include: { brandProfile: true } };
    creator: { include: { creatorProfile: true } };
  };
}>;

export class CampaignRepository {
  async findById(id: string): Promise<Campaign | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaign.findFirst({ where: { id, deletedAt: null } });
  }

  async findByIdWithAssets(id: string): Promise<CampaignWithAssets | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaign.findFirst({
      where: { id, deletedAt: null },
      include: {
        assets: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" }
        }
      }
    });
  }

  async listByBrand(brandId: string, page: number, limit: number) {
    if (!hasDatabaseUrl()) {
      return { items: [] as CampaignWithAssets[], total: 0 };
    }

    const where = { brandId, deletedAt: null };
    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          assets: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" }
          }
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.campaign.count({ where })
    ]);

    return { items, total };
  }

  async findByLegacyProjectId(legacyProjectId: string): Promise<Campaign | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaign.findFirst({
      where: {
        deletedAt: null,
        productionBrief: {
          path: ["legacy_project_id"],
          equals: legacyProjectId
        }
      }
    });
  }

  async findReviewBundleSource(id: string): Promise<CampaignWithRelations | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaign.findFirst({
      where: { id, deletedAt: null },
      include: {
        versions: {
          orderBy: { versionNumber: "asc" },
          include: {
            comments: {
              orderBy: { timeSeconds: "asc" },
              include: { annotations: true, user: { include: { brandProfile: true, creatorProfile: true } } }
            }
          }
        },
        brand: { include: { brandProfile: true } },
        creator: { include: { creatorProfile: true } }
      }
    });
  }

  async createDraft(input: {
    brandId: string;
    title: string;
    description?: string;
    budget: number;
    currency?: string;
    deadline: Date;
    platform?: string;
    aspectRatio?: string;
    legacyProjectId?: string;
    productionBrief?: Prisma.InputJsonValue;
  }): Promise<Campaign> {
    if (!hasDatabaseUrl()) {
      throw new Error("DATABASE_URL not configured");
    }

    return prisma.campaign.create({
      data: {
        brandId: input.brandId,
        title: input.title,
        description: input.description,
        budget: input.budget,
        currency: input.currency ?? "USD",
        deadline: input.deadline,
        platform: input.platform,
        aspectRatio: input.aspectRatio,
        status: "DRAFT",
        createdBy: input.brandId,
        productionBrief: {
          ...(typeof input.productionBrief === "object" && input.productionBrief !== null
            ? (input.productionBrief as Record<string, unknown>)
            : {}),
          ...(input.legacyProjectId ? { legacy_project_id: input.legacyProjectId } : {})
        }
      }
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      budget?: number;
      currency?: string;
      deadline?: Date;
      platform?: string;
      aspectRatio?: string;
    }
  ): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.budget !== undefined ? { budget: data.budget } : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.deadline !== undefined ? { deadline: data.deadline } : {}),
        ...(data.platform !== undefined ? { platform: data.platform } : {}),
        ...(data.aspectRatio !== undefined ? { aspectRatio: data.aspectRatio } : {})
      }
    });
  }

  async updateCreativeBrief(id: string, brief: Prisma.InputJsonValue, creativeDirection?: string) {
    return prisma.campaign.update({
      where: { id },
      data: {
        productionBrief: brief,
        ...(creativeDirection !== undefined ? { creativeDirection } : {})
      }
    });
  }

  async setCreator(id: string, creatorUserId: string) {
    return prisma.campaign.update({
      where: { id },
      data: { creatorId: creatorUserId }
    });
  }

  async updateStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data: { status }
    });
  }

  async softDeleteLogoAssets(campaignId: string) {
    await prisma.campaignAsset.updateMany({
      where: { campaignId, assetType: "LOGO", deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }

  async createAsset(input: {
    campaignId: string;
    uploadedBy: string;
    assetType: AssetType;
    fileName: string;
    fileKey: string;
    mimeType: string;
    fileSize: number;
    previewUrl?: string;
  }): Promise<CampaignAsset> {
    return prisma.campaignAsset.create({
      data: {
        campaignId: input.campaignId,
        uploadedBy: input.uploadedBy,
        assetType: input.assetType,
        fileName: input.fileName,
        fileKey: input.fileKey,
        mimeType: input.mimeType,
        fileSize: BigInt(input.fileSize),
        previewUrl: input.previewUrl,
        storageProvider: "local"
      }
    });
  }

  async listAssets(campaignId: string): Promise<CampaignAsset[]> {
    return prisma.campaignAsset.findMany({
      where: { campaignId, deletedAt: null },
      orderBy: { createdAt: "desc" }
    });
  }
}

export const campaignRepository = new CampaignRepository();
