import type { Prisma } from "@prisma/client";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { activityService } from "@/features/campaign/activity.service";
import {
  canvasRepository,
  type CanvasCampaignRecord,
  type CanvasProjectRecord
} from "@/features/canvas/canvas.repository";
import { aiModelGenerationGuard } from "@/features/canvas/ai-model-generation.guard";
import { canvasImageGenerationService } from "@/features/canvas/canvas-image-generation.service";
import { canvasVideoGenerationService } from "@/features/canvas/canvas-video-generation.service";
import { appError } from "@/lib/core/errors";
import { hasOpenAI } from "@/lib/core/config/ai";
import { isObjectStorageConfigured } from "@/lib/core/config/video";
import { canPersistLocalDataStore } from "@/lib/runtime-flags";
import type {
  CanvasNodeData,
  CanvasSnapshot,
  GenerationJobEvent,
  VincisCanvasEdge,
  VincisCanvasNode
} from "@/lib/canvas/types";
import { creditGenerationBillingService } from "@/features/credit-wallet/credit-generation-billing.service";
import { creditLedgerService } from "@/features/credit-wallet/credit-ledger.service";
import { creditWalletRepository } from "@/features/credit-wallet/credit-wallet.repository";
import { creditWalletService } from "@/features/credit-wallet/credit-wallet.service";
import { DEFAULT_CANVAS_BACKGROUND, normalizeHexColor } from "@/lib/canvas/color";
import { assertCanvasPayloadSize } from "@/lib/canvas/validation";

type ParsedNode = {
  id: string;
  type: "image" | "video" | "music" | "text" | "frame" | "upload" | "loading";
  position: { x: number; y: number };
  width?: number;
  height?: number;
  parentId?: string;
  zIndex?: number;
  data: Record<string, unknown>;
};

type ParsedEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data?: Record<string, unknown> | null;
};

function assertCreator(user: AuthUserDto) {
  if (user.role !== "CREATOR" && !user.hasCreatorProfile) {
    throw appError("FORBIDDEN", "Creator access required");
  }
}

function assertImageGenerationInfrastructure() {
  if (!hasOpenAI()) {
    throw appError(
      "SYSTEM_ERROR",
      "OPENAI_API_KEY is not configured. Set it in Vercel environment variables and redeploy."
    );
  }
  if (!isObjectStorageConfigured() && !canPersistLocalDataStore()) {
    throw appError(
      "SYSTEM_ERROR",
      "Object storage (R2) is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY, and R2_BUCKET in production."
    );
  }
}

function serializeJob(job: {
  id: string;
  nodeId: string | null;
  type: "IMAGE" | "VIDEO" | "MUSIC";
  status: "QUEUED" | "SUBMITTING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  progress: number;
  outputAssetId: string | null;
  errorMessage: string | null;
}): GenerationJobEvent {
  return {
    id: job.id,
    nodeId: job.nodeId,
    type: job.type,
    status: job.status,
    progress: job.progress,
    outputAssetId: job.outputAssetId,
    errorMessage: job.errorMessage
  };
}

function buildOrderContext(campaign: CanvasCampaignRecord) {
  return {
    orderId: campaign.orders[0]?.id ?? null,
    clientName: campaign.brand.brandProfile?.companyName ?? campaign.brand.fullName,
    deadline: campaign.deadline.toISOString(),
    currentVersion: campaign.currentVersion,
    reviewHref: campaign.orders[0]?.id ? `/studio/review/${campaign.orders[0].id}` : null,
    brandKit: {
      connected: Boolean(
        campaign.brand.brandProfile?.brandDnaJson ||
          campaign.brand.brandProfile?.logoUrl ||
          campaign.assets.length
      ),
      logoUrl: campaign.brand.brandProfile?.logoUrl ?? null,
      assetCount: campaign.assets.length,
      hasBrandDna: Boolean(campaign.brand.brandProfile?.brandDnaJson)
    }
  };
}

function buildStandaloneContext() {
  return {
    orderId: null,
    clientName: null,
    deadline: null,
    currentVersion: 0,
    reviewHref: null,
    brandKit: {
      connected: false,
      logoUrl: null,
      assetCount: 0,
      hasBrandDna: false
    }
  };
}

function buildSnapshot(
  project: CanvasProjectRecord,
  canvas: NonNullable<Awaited<ReturnType<typeof canvasRepository.findCanvas>>>,
  walletSummary: {
    availableCredits: number;
    reservedCredits: number;
    lifetimeSpent: number;
  }
): CanvasSnapshot {
  const campaign = project.campaign;
  const context =
    project.mode === "ORDER" && campaign
      ? buildOrderContext(campaign)
      : buildStandaloneContext();

  const nodes: VincisCanvasNode[] = canvas.nodes.map((node) => ({
    id: node.id,
    type: node.type as VincisCanvasNode["type"],
    position: { x: node.positionX, y: node.positionY },
    width: node.width ?? undefined,
    height: node.height ?? undefined,
    parentId: node.parentId ?? undefined,
    extent: node.parentId ? "parent" : undefined,
    zIndex: node.zIndex,
    data: node.data as CanvasNodeData
  }));
  const edges: VincisCanvasEdge[] = canvas.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    data: (edge.data as Record<string, unknown> | null) ?? undefined
  }));
  const viewport = canvas.viewport as {
    x?: unknown;
    y?: unknown;
    zoom?: unknown;
    backgroundColor?: unknown;
  } | null;
  const backgroundColor =
    typeof viewport?.backgroundColor === "string"
      ? normalizeHexColor(viewport.backgroundColor) ?? DEFAULT_CANVAS_BACKGROUND
      : DEFAULT_CANVAS_BACKGROUND;

  return {
    projectId: project.id,
    canvasId: canvas.id,
    mode: project.mode,
    title: project.title,
    campaignId: project.campaignId,
    campaignTitle: project.title,
    projectContext: {
      ...context,
      creditsUsed: walletSummary.lifetimeSpent,
      tokenBalance: walletSummary.availableCredits,
      reservedCredits: walletSummary.reservedCredits
    },
    nodes,
    edges,
    viewport: {
      x: typeof viewport?.x === "number" ? viewport.x : 0,
      y: typeof viewport?.y === "number" ? viewport.y : 0,
      zoom: typeof viewport?.zoom === "number" ? viewport.zoom : 1
    },
    canvasBackgroundColor: backgroundColor,
    version: canvas.version,
    updatedAt: canvas.updatedAt.toISOString()
  };
}

export class CanvasService {
  private async resolveProject(projectId: string, user: AuthUserDto): Promise<CanvasProjectRecord> {
    assertCreator(user);
    const direct = await canvasRepository.findProjectForOwner(projectId, user.id);
    if (direct) return direct;

    const campaign = await canvasRepository.findCampaignForCreator(projectId, user.id);
    if (!campaign) throw appError("NOT_FOUND", "Creative project not found");

    const existing = await canvasRepository.findProjectByCampaignForCreator(projectId, user.id);
    if (existing) return existing;

    const created = await canvasRepository.createOrderProject({
      ownerId: user.id,
      createdBy: user.id,
      campaignId: campaign.id,
      title: campaign.title
    });

    const project = await canvasRepository.findProjectForOwner(created.id, user.id);
    if (!project) throw appError("SYSTEM_ERROR", "Creative project could not be created");
    return project;
  }

  async assertAccess(projectId: string, user: AuthUserDto) {
    const project = await this.resolveProject(projectId, user);
    return project;
  }

  async listHome(user: AuthUserDto) {
    assertCreator(user);
    const [standaloneProjects, orderCampaigns] = await Promise.all([
      canvasRepository.listStandaloneProjects(user.id),
      canvasRepository.listOrderProjects(user.id)
    ]);

    const recentCanvases = [
      ...standaloneProjects.map((project) => ({
        id: project.id,
        title: project.title,
        mode: "STANDALONE" as const,
        updatedAt: (project.canvas?.updatedAt ?? project.updatedAt).toISOString()
      })),
      ...orderCampaigns.map((campaign) => ({
        id: campaign.creativeProject?.id ?? campaign.id,
        title: campaign.title,
        mode: "ORDER" as const,
        updatedAt: (
          campaign.creativeProject?.canvas?.updatedAt ?? campaign.updatedAt
        ).toISOString()
      }))
    ]
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 24);

    return { recentCanvases };
  }

  async createStandaloneProject(user: AuthUserDto, title?: string) {
    assertCreator(user);
    const now = new Date();
    const label =
      title?.trim() ||
      `空白画布 ${now.toLocaleString(user.languageCode?.startsWith("zh") ? "zh-CN" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}`;

    const project = await canvasRepository.createStandaloneProject({
      ownerId: user.id,
      createdBy: user.id,
      title: label
    });
    await canvasRepository.ensureCanvas(project.id, user.id, null);
    return project;
  }

  async getOrCreateSnapshot(projectId: string, user: AuthUserDto): Promise<CanvasSnapshot> {
    const project = await this.resolveProject(projectId, user);
    await canvasRepository.ensureCanvas(project.id, user.id, project.campaignId);
    const [canvas, wallet] = await Promise.all([
      canvasRepository.findCanvas(project.id),
      creditWalletService.getBalance(user.id)
    ]);
    if (!canvas) throw appError("SYSTEM_ERROR", "Canvas could not be created");
    const walletRecord = await creditWalletRepository.getOrCreateWallet(user.id);
    return buildSnapshot(project, canvas, {
      availableCredits: wallet.availableCredits,
      reservedCredits: wallet.reservedCredits,
      lifetimeSpent: walletRecord.lifetimeSpent
    });
  }

  async saveSnapshot(
    input: {
      projectId: string;
      nodes: ParsedNode[];
      edges: ParsedEdge[];
      viewport: { x: number; y: number; zoom: number };
    },
    user: AuthUserDto
  ) {
    const project = await this.resolveProject(input.projectId, user);
    assertCanvasPayloadSize(input);

    const nodeIds = new Set(input.nodes.map((node) => node.id));
    const frameIds = new Set(
      input.nodes.filter((node) => node.type === "frame").map((node) => node.id)
    );
    if (input.nodes.some((node) => node.parentId && !frameIds.has(node.parentId))) {
      throw appError("VALIDATION_ERROR", "Canvas child nodes must reference a valid frame");
    }
    if (
      input.edges.some(
        (edge) => !nodeIds.has(edge.source) || !nodeIds.has(edge.target) || edge.source === edge.target
      )
    ) {
      throw appError("VALIDATION_ERROR", "Canvas edge references an invalid node");
    }

    const { id: canvasId } = await canvasRepository.ensureCanvas(
      project.id,
      user.id,
      project.campaignId
    );
    const saved = await canvasRepository.replaceSnapshot({
      canvasId,
      creativeProjectId: project.id,
      campaignId: project.campaignId,
      viewport: input.viewport,
      nodes: input.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        positionX: node.position.x,
        positionY: node.position.y,
        width: node.width,
        height: node.height,
        parentId: node.parentId,
        zIndex: node.zIndex ?? 0,
        data: node.data as Prisma.InputJsonValue
      })),
      edges: input.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        data: edge.data as Prisma.InputJsonValue | undefined
      }))
    });
    return { version: saved.version, updatedAt: saved.updatedAt.toISOString() };
  }

  async createMockGeneration(
    input: {
      projectId: string;
      nodeId: string;
      type: "IMAGE" | "VIDEO" | "MUSIC";
      prompt: string;
      model: string;
      idempotencyKey: string;
      parameters: Record<string, unknown>;
    },
    user: AuthUserDto
  ) {
    if (input.type === "IMAGE") {
      assertImageGenerationInfrastructure();
    }

    const project = await this.resolveProject(input.projectId, user);
    const { id: canvasId } = await canvasRepository.ensureCanvas(
      project.id,
      user.id,
      project.campaignId
    );

    const resolved = await aiModelGenerationGuard.resolveForGeneration({
      type: input.type,
      model: input.model,
      parameters: input.parameters
    });

    const billing = await creditGenerationBillingService.reserveForGeneration({
      userId: user.id,
      type: input.type,
      model: resolved.internalModelId,
      parameters: input.parameters,
      idempotencyKey: input.idempotencyKey,
      campaignId: project.campaignId
    });

    const provider =
      input.type === "IMAGE" && hasOpenAI() && resolved.provider === "openai"
        ? "openai"
        : resolved.provider || "vincis-mock";
    const job = await canvasRepository.createGenerationJob({
      creativeProjectId: project.id,
      campaignId: project.campaignId,
      canvasId,
      ownerId: user.id,
      nodeId: input.nodeId,
      type: input.type,
      provider,
      model: resolved.internalModelId,
      aiModelId: resolved.recordId,
      modelDisplayName: resolved.displayName,
      prompt: input.prompt,
      payload: input.parameters as Prisma.InputJsonValue,
      idempotencyKey: input.idempotencyKey,
      estimatedCredits: billing.estimatedCredits,
      creditReservationId: billing.reservation.id,
      pricingRuleId: billing.quote.ruleId,
      pricingRuleVersion: billing.quote.ruleVersion,
      creditsQuoted: billing.quote.credits,
      providerCostSnapshot: {
        providerCostMinor: billing.quote.providerCostMinor,
        outputCount: billing.quote.outputCount
      } as Prisma.InputJsonValue,
      pricingSnapshot: billing.pricingSnapshot as Prisma.InputJsonValue,
      quotedAt: new Date(billing.quote.quotedAt)
    });

    await creditLedgerService.linkReservationToJob(billing.reservation.id, job.id);

    if (input.type === "IMAGE" && provider === "openai" && job.status === "QUEUED") {
      canvasImageGenerationService.scheduleJob(job.id, user.id);
    }

    if (input.type === "VIDEO" && job.status === "QUEUED") {
      canvasVideoGenerationService.scheduleJob(job.id, user.id);
    }

    if (input.type === "MUSIC" && job.status === "QUEUED") {
      const { canvasMusicGenerationService } = await import(
        "@/features/canvas/canvas-music-generation.service"
      );
      canvasMusicGenerationService.scheduleJob(job.id, user.id);
    }

    if (project.campaignId) {
      await activityService.write(
        project.campaignId,
        input.type === "IMAGE" ? "canvas.image_generation_requested" : "canvas.mock_generation_requested",
        { userId: user.id, email: user.email, role: "creator" },
        { job_id: job.id, node_id: input.nodeId, type: input.type }
      );
    }
    return { ...serializeJob(job), chargedCredits: billing.estimatedCredits };
  }

  async getJob(jobId: string, user: AuthUserDto) {
    assertCreator(user);
    let job = await canvasRepository.findGenerationJob(jobId, user.id);
    if (!job) throw appError("NOT_FOUND", "Generation job not found");

    const elapsed = Date.now() - job.createdAt.getTime();
    if (job.provider === "vincis-mock" && job.type !== "VIDEO") {
      if (job.status === "QUEUED" && elapsed >= 500) {
        job = await canvasRepository.updateGenerationJob(job.id, {
          status: "PROCESSING",
          progress: 45,
          startedAt: new Date()
        });
      }
      if ((job.status === "QUEUED" || job.status === "PROCESSING") && elapsed >= 1800) {
        job = await canvasRepository.updateGenerationJob(job.id, {
          status: "SUCCEEDED",
          progress: 100,
          actualCredits: job.estimatedCredits,
          completedAt: new Date()
        });
      }
    }

    job = (await canvasRepository.findGenerationJob(jobId, user.id)) ?? job;
    await creditGenerationBillingService.syncJobBilling(job);
    job = (await canvasRepository.findGenerationJob(jobId, user.id)) ?? job;
    return serializeJob(job);
  }

  async listJobEvents(projectId: string, user: AuthUserDto) {
    const project = await this.resolveProject(projectId, user);
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const jobs = await canvasRepository.listGenerationJobs(project.id, user.id, since);
    return Promise.all(jobs.map((job) => this.getJob(job.id, user)));
  }
}

export const canvasService = new CanvasService();
