import type { CreativeProjectMode, GenerationStatus, GenerationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/database/prisma";
import { isUniqueConstraintError } from "@/lib/core/prisma-errors";
import type { CanvasLibraryAssetType } from "@/lib/canvas/canvas-library-kind";
import {
  CANVAS_LIBRARY_ASSET_KIND,
  LEGACY_CANVAS_ASSET_KIND
} from "@/lib/canvas/canvas-asset-metadata";

const libraryAssetMetadataWhere = {
  OR: [
    { metadataJson: { path: ["kind"], equals: CANVAS_LIBRARY_ASSET_KIND } },
    {
      AND: [
        { metadataJson: { path: ["kind"], equals: LEGACY_CANVAS_ASSET_KIND } },
        { metadataJson: { path: ["source"], equals: "creator_upload" } }
      ]
    }
  ]
} satisfies Prisma.CreativeProjectAssetWhereInput;

const libraryAssetSelect = {
  id: true,
  fileName: true,
  mimeType: true,
  assetType: true,
  previewUrl: true,
  metadataJson: true,
  createdAt: true
} as const;

const campaignContextSelect = {
  id: true,
  title: true,
  creatorId: true,
  status: true,
  deadline: true,
  currentVersion: true,
  brand: {
    select: {
      fullName: true,
      brandProfile: {
        select: { companyName: true, logoUrl: true, brandDnaJson: true }
      }
    }
  },
  orders: {
    select: { id: true },
    orderBy: { createdAt: "desc" as const },
    take: 1
  },
  assets: {
    where: { deletedAt: null },
    select: { id: true, assetType: true }
  }
} as const;

export const canvasRepository = {
  findProjectForOwner(projectId: string, ownerId: string) {
    return prisma.creativeProject.findFirst({
      where: { id: projectId, ownerId, deletedAt: null },
      include: {
        campaign: { select: campaignContextSelect },
        canvas: {
          select: { id: true, updatedAt: true, version: true, viewport: true }
        }
      }
    });
  },

  findProjectByCampaignForCreator(campaignId: string, ownerId: string) {
    return prisma.creativeProject.findFirst({
      where: { campaignId, ownerId, deletedAt: null },
      include: {
        campaign: { select: campaignContextSelect },
        canvas: {
          select: { id: true, updatedAt: true, version: true, viewport: true }
        }
      }
    });
  },

  findCampaignForCreator(campaignId: string, creatorId: string) {
    return prisma.campaign.findFirst({
      where: { id: campaignId, creatorId, deletedAt: null },
      select: campaignContextSelect
    });
  },

  listStandaloneProjects(ownerId: string) {
    return prisma.creativeProject.findMany({
      where: { ownerId, mode: "STANDALONE", deletedAt: null },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        canvas: { select: { updatedAt: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 24
    });
  },

  listOrderProjects(ownerId: string) {
    return prisma.campaign.findMany({
      where: { creatorId: ownerId, deletedAt: null },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        creativeProject: {
          select: {
            id: true,
            canvas: { select: { updatedAt: true } }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });
  },

  createStandaloneProject(input: { ownerId: string; createdBy: string; title: string }) {
    return prisma.creativeProject.create({
      data: {
        ownerId: input.ownerId,
        createdBy: input.createdBy,
        title: input.title,
        mode: "STANDALONE"
      },
      select: { id: true, title: true }
    });
  },

  createOrderProject(input: {
    ownerId: string;
    createdBy: string;
    campaignId: string;
    title: string;
  }) {
    return prisma.creativeProject.create({
      data: {
        ownerId: input.ownerId,
        createdBy: input.createdBy,
        campaignId: input.campaignId,
        title: input.title,
        mode: "ORDER"
      },
      select: { id: true, title: true, campaignId: true }
    });
  },

  ensureCanvas(projectId: string, createdBy: string, campaignId?: string | null) {
    return prisma.creativeCanvas.upsert({
      where: { creativeProjectId: projectId },
      create: {
        creativeProjectId: projectId,
        campaignId: campaignId ?? null,
        createdBy,
        viewport: { x: 0, y: 0, zoom: 1 }
      },
      update: {},
      select: { id: true }
    });
  },

  findCanvas(projectId: string) {
    return prisma.creativeCanvas.findUnique({
      where: { creativeProjectId: projectId },
      include: {
        creativeProject: { select: { title: true, mode: true, campaignId: true } },
        nodes: { orderBy: [{ zIndex: "asc" }, { createdAt: "asc" }] },
        edges: { orderBy: { createdAt: "asc" } }
      }
    });
  },

  async replaceSnapshot(input: {
    canvasId: string;
    creativeProjectId: string;
    campaignId?: string | null;
    viewport: Prisma.InputJsonValue;
    nodes: {
      id: string;
      type: string;
      positionX: number;
      positionY: number;
      width?: number;
      height?: number;
      data: Prisma.InputJsonValue;
      zIndex: number;
      parentId?: string;
    }[];
    edges: {
      id: string;
      source: string;
      target: string;
      sourceHandle?: string | null;
      targetHandle?: string | null;
      data?: Prisma.InputJsonValue;
    }[];
  }) {
    const nodeIds = input.nodes.map((node) => node.id);
    const edgeIds = input.edges.map((edge) => edge.id);

    return prisma.$transaction(async (tx) => {
      await Promise.all(
        input.nodes.map((node) =>
          tx.canvasNode.upsert({
            where: { id: node.id },
            create: {
              id: node.id,
              type: node.type,
              positionX: node.positionX,
              positionY: node.positionY,
              width: node.width,
              height: node.height,
              parentId: node.parentId,
              data: node.data,
              zIndex: node.zIndex,
              creativeProjectId: input.creativeProjectId,
              campaignId: input.campaignId ?? null,
              canvasId: input.canvasId
            },
            update: {
              type: node.type,
              positionX: node.positionX,
              positionY: node.positionY,
              width: node.width,
              height: node.height,
              parentId: node.parentId,
              data: node.data,
              zIndex: node.zIndex,
              creativeProjectId: input.creativeProjectId,
              campaignId: input.campaignId ?? null,
              canvasId: input.canvasId
            }
          })
        )
      );

      await tx.canvasNode.deleteMany({
        where: {
          canvasId: input.canvasId,
          ...(nodeIds.length > 0 ? { id: { notIn: nodeIds } } : {})
        }
      });

      await Promise.all(
        input.edges.map((edge) =>
          tx.canvasEdge.upsert({
            where: { id: edge.id },
            create: {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              sourceHandle: edge.sourceHandle ?? null,
              targetHandle: edge.targetHandle ?? null,
              data: edge.data,
              creativeProjectId: input.creativeProjectId,
              campaignId: input.campaignId ?? null,
              canvasId: input.canvasId
            },
            update: {
              source: edge.source,
              target: edge.target,
              sourceHandle: edge.sourceHandle ?? null,
              targetHandle: edge.targetHandle ?? null,
              data: edge.data,
              creativeProjectId: input.creativeProjectId,
              campaignId: input.campaignId ?? null,
              canvasId: input.canvasId
            }
          })
        )
      );

      await tx.canvasEdge.deleteMany({
        where: {
          canvasId: input.canvasId,
          ...(edgeIds.length > 0 ? { id: { notIn: edgeIds } } : {})
        }
      });

      return tx.creativeCanvas.update({
        where: { id: input.canvasId },
        data: { viewport: input.viewport, version: { increment: 1 } },
        select: { version: true, updatedAt: true }
      });
    });
  },

  async sumGenerationCredits(projectId: string) {
    const jobs = await prisma.generationJob.findMany({
      where: { creativeProjectId: projectId, status: { not: "CANCELLED" } },
      select: { estimatedCredits: true, actualCredits: true }
    });
    const used = jobs.reduce((total, job) => {
      const raw = job.actualCredits ?? job.estimatedCredits;
      const credits =
        typeof raw === "number" && Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;
      return total + credits;
    }, 0);
    return { used: Math.max(0, used) };
  },

  createAiDirectorLog(input: {
    campaignId?: string | null;
    input: Prisma.InputJsonValue;
    output: Prisma.InputJsonValue;
    provider: string;
    tokenInput: number;
    tokenOutput: number;
    cost: number;
    latencyMs: number;
  }) {
    return prisma.aiJob.create({
      data: {
        campaignId: input.campaignId ?? null,
        type: "CANVAS_DIRECTOR_PLAN",
        provider: input.provider,
        status: "SUCCESS",
        inputJson: input.input,
        outputJson: input.output,
        tokenInput: input.tokenInput,
        tokenOutput: input.tokenOutput,
        cost: input.cost,
        latencyMs: input.latencyMs,
        completedAt: new Date()
      }
    });
  },

  findCampaignAsset(assetId: string, campaignId: string) {
    return prisma.campaignAsset.findFirst({
      where: { id: assetId, campaignId, deletedAt: null }
    });
  },

  findProjectAsset(assetId: string, projectId: string) {
    return prisma.creativeProjectAsset.findFirst({
      where: { id: assetId, creativeProjectId: projectId, deletedAt: null }
    });
  },

  findAssetById(assetId: string) {
    return prisma.campaignAsset.findFirst({
      where: { id: assetId, deletedAt: null }
    });
  },

  findProjectAssetById(assetId: string) {
    return prisma.creativeProjectAsset.findFirst({
      where: { id: assetId, deletedAt: null }
    });
  },

  listProjectAssets(projectId: string) {
    return prisma.creativeProjectAsset.findMany({
      where: { creativeProjectId: projectId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 48,
      select: libraryAssetSelect
    });
  },

  listProjectLibraryAssets(projectId: string, assetType: CanvasLibraryAssetType) {
    return prisma.creativeProjectAsset.findMany({
      where: {
        creativeProjectId: projectId,
        deletedAt: null,
        assetType,
        ...libraryAssetMetadataWhere
      },
      orderBy: { createdAt: "desc" },
      take: 48,
      select: libraryAssetSelect
    });
  },

  listCampaignLibraryAssets(campaignId: string, assetType: CanvasLibraryAssetType) {
    return prisma.campaignAsset.findMany({
      where: {
        campaignId,
        deletedAt: null,
        assetType,
        ...libraryAssetMetadataWhere
      },
      orderBy: { createdAt: "desc" },
      take: 48,
      select: libraryAssetSelect
    });
  },

  findProjectLibraryAssetIds(projectId: string, assetIds: string[], assetType: CanvasLibraryAssetType) {
    return prisma.creativeProjectAsset.findMany({
      where: {
        creativeProjectId: projectId,
        deletedAt: null,
        id: { in: assetIds },
        assetType,
        ...libraryAssetMetadataWhere
      },
      select: { id: true }
    });
  },

  findCampaignLibraryAssetIds(campaignId: string, assetIds: string[], assetType: CanvasLibraryAssetType) {
    return prisma.campaignAsset.findMany({
      where: {
        campaignId,
        deletedAt: null,
        id: { in: assetIds },
        assetType,
        ...libraryAssetMetadataWhere
      },
      select: { id: true }
    });
  },

  listCampaignAssets(campaignId: string) {
    return prisma.campaignAsset.findMany({
      where: { campaignId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 48,
      select: libraryAssetSelect
    });
  },

  softDeleteProjectAssets(projectId: string, assetIds: string[]) {
    return prisma.creativeProjectAsset.updateMany({
      where: {
        creativeProjectId: projectId,
        id: { in: assetIds },
        deletedAt: null
      },
      data: { deletedAt: new Date() }
    });
  },

  softDeleteCampaignAssets(campaignId: string, assetIds: string[]) {
    return prisma.campaignAsset.updateMany({
      where: {
        campaignId,
        id: { in: assetIds },
        deletedAt: null
      },
      data: { deletedAt: new Date() }
    });
  },

  createCampaignAsset(input: {
    campaignId: string;
    uploadedBy: string;
    assetType: "REFERENCE_IMAGE" | "REFERENCE_VIDEO" | "MUSIC";
    fileName: string;
    fileKey: string;
    storageProvider: string;
    mimeType: string;
    fileSize: number;
    previewUrl?: string;
    metadataJson: Prisma.InputJsonValue;
  }) {
    return prisma.campaignAsset.create({
      data: { ...input, fileSize: BigInt(input.fileSize) }
    });
  },

  createProjectAsset(input: {
    creativeProjectId: string;
    uploadedBy: string;
    assetType: "REFERENCE_IMAGE" | "REFERENCE_VIDEO" | "MUSIC";
    fileName: string;
    fileKey: string;
    storageProvider: string;
    mimeType: string;
    fileSize: number;
    previewUrl?: string;
    metadataJson: Prisma.InputJsonValue;
  }) {
    return prisma.creativeProjectAsset.create({
      data: { ...input, fileSize: BigInt(input.fileSize) }
    });
  },

  async createGenerationJob(input: {
    creativeProjectId: string;
    campaignId?: string | null;
    canvasId: string;
    ownerId: string;
    nodeId: string;
    type: GenerationType;
    provider: string;
    model: string;
    aiModelId?: string | null;
    modelDisplayName?: string | null;
    prompt: string;
    payload: Prisma.InputJsonValue;
    idempotencyKey: string;
    estimatedCredits: number;
    creditReservationId?: string;
    pricingRuleId?: string | null;
    pricingRuleVersion?: number | null;
    creditsQuoted?: number | null;
    providerCostSnapshot?: Prisma.InputJsonValue;
    pricingSnapshot?: Prisma.InputJsonValue;
    quotedAt?: Date | null;
  }) {
    const data = {
      creativeProjectId: input.creativeProjectId,
      campaignId: input.campaignId ?? null,
      canvasId: input.canvasId,
      ownerId: input.ownerId,
      nodeId: input.nodeId,
      type: input.type,
      provider: input.provider,
      model: input.model,
      aiModelId: input.aiModelId ?? null,
      modelDisplayName: input.modelDisplayName ?? null,
      prompt: input.prompt,
      input: input.payload,
      idempotencyKey: input.idempotencyKey,
      estimatedCredits: input.estimatedCredits,
      creditReservationId: input.creditReservationId ?? null,
      pricingRuleId: input.pricingRuleId ?? null,
      pricingRuleVersion: input.pricingRuleVersion ?? null,
      creditsQuoted: input.creditsQuoted ?? input.estimatedCredits,
      providerCostSnapshot: input.providerCostSnapshot,
      pricingSnapshot: input.pricingSnapshot,
      quotedAt: input.quotedAt ?? null
    };

    try {
      const job = await prisma.generationJob.create({ data });
      return { job, created: true as const };
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      const job = await prisma.generationJob.findUniqueOrThrow({
        where: {
          ownerId_idempotencyKey: {
            ownerId: input.ownerId,
            idempotencyKey: input.idempotencyKey
          }
        }
      });
      return { job, created: false as const };
    }
  },

  findGenerationJob(jobId: string, ownerId: string) {
    return prisma.generationJob.findFirst({ where: { id: jobId, ownerId } });
  },

  findGenerationJobByProviderTaskId(providerTaskId: string) {
    return prisma.generationJob.findFirst({ where: { providerTaskId } });
  },

  listGenerationJobs(projectId: string, ownerId: string, since: Date) {
    return prisma.generationJob.findMany({
      where: { creativeProjectId: projectId, ownerId, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      take: 50
    });
  },

  updateGenerationJob(
    id: string,
    data: {
      status: GenerationStatus;
      progress: number;
      startedAt?: Date;
      completedAt?: Date;
      actualCredits?: number;
      outputAssetId?: string;
      providerTaskId?: string;
      errorCode?: string;
      errorMessage?: string;
    }
  ) {
    return prisma.generationJob.update({ where: { id }, data });
  },

  async claimGenerationJob(
    jobId: string,
    ownerId: string,
    input?: { progress?: number }
  ) {
    const result = await prisma.generationJob.updateMany({
      where: {
        id: jobId,
        ownerId,
        status: { in: ["QUEUED", "SUBMITTING"] }
      },
      data: {
        status: "PROCESSING",
        progress: input?.progress ?? 10,
        startedAt: new Date()
      }
    });
    if (result.count === 0) return null;
    return prisma.generationJob.findFirst({ where: { id: jobId, ownerId } });
  }
};

export type CanvasProjectRecord = NonNullable<
  Awaited<ReturnType<typeof canvasRepository.findProjectForOwner>>
>;

export type CanvasCampaignRecord = NonNullable<
  Awaited<ReturnType<typeof canvasRepository.findCampaignForCreator>>
>;

export type CanvasProjectModeValue = CreativeProjectMode;
