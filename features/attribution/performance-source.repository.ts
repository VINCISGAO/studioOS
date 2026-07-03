import type {
  PerformanceSource,
  PerformanceSourcePlatform,
  PerformanceSourceStatus,
  Prisma
} from "@prisma/client";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";
import type { SerializedPerformanceSource } from "@/features/attribution/performance-source.types";

type PerformanceSourceWithCampaign = PerformanceSource & {
  campaign?: { title: string } | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function serializePerformanceSource(
  source: PerformanceSourceWithCampaign
): SerializedPerformanceSource {
  return {
    id: source.id,
    campaignId: source.campaignId,
    campaignTitle: source.campaign?.title ?? "Campaign",
    uploadedBy: source.uploadedBy,
    platform: source.platform,
    sourceType: source.sourceType,
    url: source.url,
    status: source.status,
    fileKey: source.fileKey,
    fileName: source.fileName,
    mimeType: source.mimeType,
    fileSize: source.fileSize == null ? null : Number(source.fileSize),
    metricsJson: asRecord(source.metricsJson),
    analysisJson: asRecord(source.analysisJson),
    errorMessage: source.errorMessage,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
    analyzedAt: source.analyzedAt?.toISOString() ?? null
  };
}

export class PerformanceSourceRepository {
  isEnabled() {
    return hasDatabaseUrl();
  }

  async findBrandUser(email: string) {
    if (!this.isEnabled()) return null;
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findAccessibleCampaign(campaignRef: string, brandEmail: string) {
    if (!this.isEnabled()) return null;
    const normalized = brandEmail.toLowerCase();
    const direct = await prisma.campaign.findFirst({
      where: {
        deletedAt: null,
        brand: { email: normalized },
        OR: [
          { id: campaignRef },
          {
            productionBrief: {
              path: ["legacy_project_id"],
              equals: campaignRef
            }
          }
        ]
      },
      include: { brand: true }
    });
    if (direct) return direct;

    const campaigns = await prisma.campaign.findMany({
      where: { deletedAt: null, brand: { email: normalized } },
      include: { brand: true },
      orderBy: { updatedAt: "desc" }
    });
    return campaigns.find((campaign) => {
      const brief = asRecord(campaign.productionBrief);
      return campaign.id === campaignRef || brief?.legacy_project_id === campaignRef;
    }) ?? null;
  }

  async listForBrandEmail(email: string): Promise<SerializedPerformanceSource[]> {
    if (!this.isEnabled()) return [];
    const items = await prisma.performanceSource.findMany({
      where: {
        campaign: {
          deletedAt: null,
          brand: { email: email.toLowerCase() }
        }
      },
      include: { campaign: { select: { title: true } } },
      orderBy: { createdAt: "desc" }
    });
    return items.map(serializePerformanceSource);
  }

  async create(input: {
    campaignId: string;
    uploadedBy: string;
    platform: PerformanceSourcePlatform;
    sourceType: string;
    url?: string | null;
  }) {
    return prisma.performanceSource.create({
      data: {
        campaignId: input.campaignId,
        uploadedBy: input.uploadedBy,
        platform: input.platform,
        sourceType: input.sourceType,
        url: input.url ?? null
      },
      include: { campaign: { select: { title: true } } }
    });
  }

  async update(
    sourceId: string,
    data: {
      status?: PerformanceSourceStatus;
      fileKey?: string | null;
      fileName?: string | null;
      mimeType?: string | null;
      fileSize?: number | null;
      metricsJson?: Prisma.InputJsonValue;
      analysisJson?: Prisma.InputJsonValue;
      errorMessage?: string | null;
      analyzedAt?: Date | null;
    }
  ) {
    return prisma.performanceSource.update({
      where: { id: sourceId },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.fileKey !== undefined ? { fileKey: data.fileKey } : {}),
        ...(data.fileName !== undefined ? { fileName: data.fileName } : {}),
        ...(data.mimeType !== undefined ? { mimeType: data.mimeType } : {}),
        ...(data.fileSize !== undefined
          ? { fileSize: data.fileSize == null ? null : BigInt(data.fileSize) }
          : {}),
        ...(data.metricsJson !== undefined ? { metricsJson: asInputJson(data.metricsJson) } : {}),
        ...(data.analysisJson !== undefined ? { analysisJson: asInputJson(data.analysisJson) } : {}),
        ...(data.errorMessage !== undefined ? { errorMessage: data.errorMessage } : {}),
        ...(data.analyzedAt !== undefined ? { analyzedAt: data.analyzedAt } : {})
      },
      include: { campaign: { select: { title: true } } }
    });
  }
}

export const performanceSourceRepository = new PerformanceSourceRepository();
