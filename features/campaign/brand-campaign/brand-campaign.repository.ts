import type { AssetType, Campaign, CampaignAsset, Prisma } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { userRepository } from "@/features/auth/user.repository";
import type {
  BrandCampaignMemory,
  BrandProductionBrief
} from "@/features/campaign/brand-campaign/brand-campaign.types";
import { asInputJson } from "@/lib/core/prisma-json";

export class BrandCampaignRepository {
  assertDb() {
    if (!hasDatabaseUrl()) {
      throw new Error("DATABASE_URL not configured");
    }
  }

  async findBrandUserByEmail(email: string) {
    this.assertDb();
    return userRepository.findByEmail(email.toLowerCase());
  }

  async findByLegacyProjectId(legacyProjectId: string) {
    this.assertDb();
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

  /** Lightweight lookup for asset uploads — skips loading all campaign assets. */
  async findUploadContextByLegacyProjectId(legacyProjectId: string) {
    this.assertDb();
    return prisma.campaign.findFirst({
      where: {
        deletedAt: null,
        productionBrief: {
          path: ["legacy_project_id"],
          equals: legacyProjectId
        }
      },
      select: {
        id: true,
        brandId: true,
        brand: { select: { email: true } }
      }
    });
  }

  async listByBrandEmail(email: string) {
    this.assertDb();
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

  async createDraft(input: {
    brandId: string;
    legacyProjectId: string;
    title: string;
    client: { email: string; name: string; company_name: string };
    wizardEphemeral?: boolean;
  }): Promise<Campaign> {
    this.assertDb();
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

  async updateCampaign(
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
      status?: Campaign["status"];
    }
  ) {
    this.assertDb();
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

  async softDeleteCampaign(campaignId: string) {
    this.assertDb();
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { deletedAt: new Date() }
    });
  }

  async softDeleteAssetsByType(campaignId: string, assetType: AssetType) {
    this.assertDb();
    await prisma.campaignAsset.updateMany({
      where: { campaignId, assetType, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }

  async softDeleteReferenceByUrl(campaignId: string, sourceUrl: string) {
    this.assertDb();
    const assets = await prisma.campaignAsset.findMany({
      where: { campaignId, deletedAt: null }
    });
    const matches = assets.filter((asset) => {
      const meta = asset.metadataJson as { kind?: string; source_url?: string } | null;
      return meta?.kind === "reference" && meta.source_url === sourceUrl;
    });
    if (!matches.length) return;
    await prisma.campaignAsset.updateMany({
      where: { id: { in: matches.map((item) => item.id) } },
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
    storageProvider?: string;
    previewUrl?: string;
    metadataJson?: Prisma.InputJsonValue;
  }): Promise<CampaignAsset> {
    this.assertDb();
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
        metadataJson: input.metadataJson,
        storageProvider: input.storageProvider ?? "local"
      }
    });
  }

  async softDeleteAsset(assetId: string, campaignId: string) {
    this.assertDb();
    await prisma.campaignAsset.updateMany({
      where: { id: assetId, campaignId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }
}

export const brandCampaignRepository = new BrandCampaignRepository();
