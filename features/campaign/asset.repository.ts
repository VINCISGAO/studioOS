import type { AssetType, CampaignAsset, Prisma } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class AssetRepository {
  private assertDb() {
    if (!hasDatabaseUrl()) {
      throw new Error("DATABASE_URL not configured");
    }
  }

  async softDeleteByType(campaignId: string, assetType: AssetType) {
    this.assertDb();
    await prisma.campaignAsset.updateMany({
      where: { campaignId, assetType, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }

  async softDeleteById(assetId: string, campaignId: string) {
    this.assertDb();
    await prisma.campaignAsset.updateMany({
      where: { id: assetId, campaignId, deletedAt: null },
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

  async create(input: {
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

  async listByCampaign(campaignId: string): Promise<CampaignAsset[]> {
    if (!hasDatabaseUrl()) return [];
    return prisma.campaignAsset.findMany({
      where: { campaignId, deletedAt: null },
      orderBy: { createdAt: "desc" }
    });
  }

  async updateMetadataJson(
    assetId: string,
    campaignId: string,
    metadataJson: Prisma.InputJsonValue
  ): Promise<CampaignAsset> {
    this.assertDb();
    return prisma.campaignAsset.update({
      where: { id: assetId, campaignId },
      data: { metadataJson }
    });
  }
}

export const assetRepository = new AssetRepository();
