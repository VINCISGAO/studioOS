import type { AssetType, Campaign, CampaignAsset, CampaignStatus, Prisma } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { userRepository } from "@/features/auth/user.repository";
import { assetRepository } from "@/features/campaign/asset.repository";
import type {
  BrandCampaignMemory,
  BrandCampaignSelection,
  BrandProductionBrief
} from "@/features/campaign/brand-campaign/brand-campaign.types";
import { readCampaignMemory } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import { asInputJson } from "@/lib/core/prisma-json";

export type CampaignWithAssets = Prisma.CampaignGetPayload<{ include: { assets: true } }>;

export type CampaignWithRelations = Prisma.CampaignGetPayload<{
  include: {
    versions: { include: { comments: { include: { annotations: true; user: true } } } };
    brand: { include: { brandProfile: true } };
    creator: { include: { creatorProfile: true } };
  };
}>;

export type CampaignWithBrandAndAssets = Prisma.CampaignGetPayload<{
  include: {
    brand: { include: { brandProfile: true } };
    assets: true;
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

  async findByLegacyProjectIdWithRelations(
    legacyProjectId: string
  ): Promise<CampaignWithBrandAndAssets | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaign.findFirst({
      where: {
        deletedAt: null,
        productionBrief: {
          path: ["legacy_project_id"],
          equals: legacyProjectId
        }
      },
      include: {
        brand: { include: { brandProfile: true } },
        assets: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } }
      }
    });
  }

  async findByIdWithBrandAndAssets(id: string): Promise<CampaignWithBrandAndAssets | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaign.findFirst({
      where: { id, deletedAt: null },
      include: {
        brand: { include: { brandProfile: true } },
        assets: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } }
      }
    });
  }

  async listByBrandEmail(email: string): Promise<CampaignWithBrandAndAssets[]> {
    if (!hasDatabaseUrl()) return [];
    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) return [];
    return prisma.campaign.findMany({
      where: { brandId: user.id, deletedAt: null },
      include: {
        brand: { include: { brandProfile: true } },
        assets: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } }
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  async findBrandUserByEmail(email: string) {
    if (!hasDatabaseUrl()) return null;
    return userRepository.findByEmail(email.toLowerCase());
  }

  async createBrandWizardDraft(input: {
    brandId: string;
    legacyProjectId: string;
    title: string;
    client: { email: string; name: string; company_name: string };
    wizardEphemeral?: boolean;
  }): Promise<CampaignWithBrandAndAssets> {
    if (!hasDatabaseUrl()) {
      throw new Error("DATABASE_URL not configured");
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);

    const productionBrief: BrandProductionBrief = {
      legacy_project_id: input.legacyProjectId,
      product: { name: "", url: "", category: "" }
    };
    const campaignMemory: BrandCampaignMemory = {
      wizard: {
        step: 1,
        completed_steps: [],
        ephemeral: input.wizardEphemeral === true
      },
      client: {
        email: input.client.email.toLowerCase(),
        name: input.client.name,
        company_name: input.client.company_name
      },
      visibility: "invite_only"
    };

    return prisma.campaign.create({
      data: {
        brandId: input.brandId,
        title: input.title,
        description: "",
        budget: 200,
        currency: "USD",
        deadline,
        status: "DRAFT",
        createdBy: input.brandId,
        productionBrief: asInputJson(productionBrief),
        campaignMemoryJson: asInputJson(campaignMemory)
      },
      include: {
        brand: { include: { brandProfile: true } },
        assets: { where: { deletedAt: null } }
      }
    });
  }

  async updateBrandCampaign(
    campaignId: string,
    data: {
      title?: string;
      description?: string;
      budget?: number;
      deadline?: Date;
      platform?: string;
      aspectRatio?: string;
      productionBrief?: BrandProductionBrief;
      campaignMemoryJson?: BrandCampaignMemory;
      status?: CampaignStatus;
    }
  ): Promise<CampaignWithBrandAndAssets> {
    return prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.budget !== undefined ? { budget: data.budget } : {}),
        ...(data.deadline !== undefined ? { deadline: data.deadline } : {}),
        ...(data.platform !== undefined ? { platform: data.platform } : {}),
        ...(data.aspectRatio !== undefined ? { aspectRatio: data.aspectRatio } : {}),
        ...(data.productionBrief !== undefined
          ? { productionBrief: asInputJson(data.productionBrief) }
          : {}),
        ...(data.campaignMemoryJson !== undefined
          ? { campaignMemoryJson: asInputJson(data.campaignMemoryJson) }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {})
      },
      include: {
        brand: { include: { brandProfile: true } },
        assets: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } }
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

  async selectCreator(input: {
    campaignId: string;
    creatorUserId: string;
    productionBrief?: BrandProductionBrief;
    campaignMemoryJson?: BrandCampaignMemory;
    status?: CampaignStatus;
  }): Promise<CampaignWithBrandAndAssets> {
    return prisma.campaign.update({
      where: { id: input.campaignId },
      data: {
        creatorId: input.creatorUserId,
        ...(input.productionBrief !== undefined
          ? { productionBrief: asInputJson(input.productionBrief) }
          : {}),
        ...(input.campaignMemoryJson !== undefined
          ? { campaignMemoryJson: asInputJson(input.campaignMemoryJson) }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {})
      },
      include: {
        brand: { include: { brandProfile: true } },
        assets: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } }
      }
    });
  }

  /**
   * Atomic creator selection lock — only one brand selection can win.
   * Also expires non-winner invitations inside the same transaction.
   */
  async tryAcquireCreatorSelection(input: {
    campaignId: string;
    creatorUserId: string;
    winnerInvitationId: string;
    productionBrief: BrandProductionBrief;
    campaignMemoryJson: BrandCampaignMemory;
  }): Promise<
    | { acquired: true }
    | { acquired: false; existingSelection: BrandCampaignSelection | null }
  > {
    if (!hasDatabaseUrl()) {
      return { acquired: false, existingSelection: null };
    }

    return prisma.$transaction(async (tx) => {
      const current = await tx.campaign.findFirst({
        where: { id: input.campaignId, deletedAt: null },
        select: { campaignMemoryJson: true, creatorId: true }
      });

      if (!current) {
        return { acquired: false, existingSelection: null };
      }

      const memory = readCampaignMemory(current.campaignMemoryJson) as BrandCampaignMemory;
      const existingSelection = memory.selection ?? null;

      if (existingSelection || current.creatorId) {
        return { acquired: false, existingSelection };
      }

      const updated = await tx.campaign.updateMany({
        where: {
          id: input.campaignId,
          deletedAt: null,
          creatorId: null
        },
        data: {
          creatorId: input.creatorUserId,
          productionBrief: asInputJson(input.productionBrief),
          campaignMemoryJson: asInputJson(input.campaignMemoryJson)
        }
      });

      if (updated.count !== 1) {
        const refreshed = await tx.campaign.findFirst({
          where: { id: input.campaignId, deletedAt: null },
          select: { campaignMemoryJson: true }
        });
        const refreshedMemory = readCampaignMemory(refreshed?.campaignMemoryJson) as BrandCampaignMemory;
        return {
          acquired: false,
          existingSelection: refreshedMemory.selection ?? null
        };
      }

      await tx.creatorInvitation.updateMany({
        where: {
          campaignId: input.campaignId,
          id: { not: input.winnerInvitationId },
          status: { in: ["SENT", "VIEWED", "ACCEPTED"] }
        },
        data: { status: "EXPIRED", respondedAt: new Date() }
      });

      return { acquired: true };
    });
  }

  async updateStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data: { status }
    });
  }

  async setCurrentVersion(id: string, versionNumber: number): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data: {
        currentVersion: versionNumber,
        reviewRound: versionNumber
      }
    });
  }

  async softDeleteLogoAssets(campaignId: string) {
    await assetRepository.softDeleteByType(campaignId, "LOGO");
  }

  async createAsset(input: {
    campaignId: string;
    uploadedBy: string;
    assetType: AssetType;
    fileName: string;
    fileKey: string;
    mimeType: string;
    fileSize: number;
    storageProvider?: string;
    previewUrl?: string;
    metadataJson?: Prisma.InputJsonValue;
  }): Promise<CampaignAsset> {
    return assetRepository.create(input);
  }

  async listAssets(campaignId: string): Promise<CampaignAsset[]> {
    return assetRepository.listByCampaign(campaignId);
  }
}

export const campaignRepository = new CampaignRepository();
