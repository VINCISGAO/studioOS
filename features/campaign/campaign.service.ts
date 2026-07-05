import type { Campaign, CampaignAsset } from "@prisma/client";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignBrandPortalService } from "@/features/campaign/campaign-brand.service";
import type { CreateCampaignBody, UpdateCampaignBody } from "@/features/campaign/campaign.schemas";
import type { CampaignStateValue, CampaignEventValue } from "@/features/campaign/campaign.state-machine";
import { campaignStateMachine } from "@/features/campaign/campaign.state-machine";
import { PermissionService, type AuthUser } from "@/features/auth/permission.service";
import { runTransition } from "@/lib/core/transition-runner";
import { appError } from "@/lib/core/errors";
import { CampaignEvents } from "@/features/shared/types/events";
import { logger } from "@/lib/core/logger";
import { memoryService } from "@/features/memory/memory.service";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { CampaignStatus } from "@prisma/client";

export type CreateCampaignInput = {
  brandId: string;
  title: string;
  description?: string;
  budget: number;
  currency?: string;
  deadline: Date;
  platform?: string;
  aspectRatio?: string;
};

function toMachineState(status: CampaignStatus): CampaignStateValue {
  return status as CampaignStateValue;
}

function parseDeadline(raw: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T23:59:59.000Z`);
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw appError("VALIDATION_ERROR", "Invalid deadline");
  }
  return parsed;
}

export function serializeCampaign(
  campaign: Campaign & { assets?: CampaignAsset[] }
) {
  return {
    id: campaign.id,
    brandId: campaign.brandId,
    creatorId: campaign.creatorId,
    title: campaign.title,
    description: campaign.description,
    budget: Number(campaign.budget),
    currency: campaign.currency,
    deadline: campaign.deadline.toISOString(),
    platform: campaign.platform,
    aspectRatio: campaign.aspectRatio,
    status: campaign.status,
    reviewRound: campaign.reviewRound,
    currentVersion: campaign.currentVersion,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
    assets: campaign.assets?.map((asset) => ({
      id: asset.id,
      assetType: asset.assetType,
      fileName: asset.fileName,
      previewUrl: asset.previewUrl,
      mimeType: asset.mimeType,
      fileSize: Number(asset.fileSize)
    }))
  };
}

export class CampaignService {
  private assertDb() {
    if (!hasDatabaseUrl()) {
      throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    }
  }

  private async getOwnedCampaign(campaignId: string, user: AuthUser) {
    this.assertDb();
    const campaign = await campaignRepository.findByIdWithAssets(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }
    return campaign;
  }

  async listForUser(user: AuthUser, page: number, limit: number) {
    this.assertDb();
    PermissionService.assert(user, "campaign.read");

    if (user.role.toUpperCase() === "ADMIN") {
      const where = { deletedAt: null };
      const [items, total] = await Promise.all([
        prisma.campaign.findMany({
          where,
          include: { assets: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } } },
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.campaign.count({ where })
      ]);
      return { items, total, page, limit };
    }

    const { items, total } = await campaignRepository.listByBrand(user.id, page, limit);
    return { items, total, page, limit };
  }

  async findById(id: string) {
    if (!hasDatabaseUrl()) return null;
    return campaignRepository.findByIdWithAssets(id);
  }

  async getDetail(campaignId: string, user: AuthUser) {
    return this.getOwnedCampaign(campaignId, user);
  }

  async create(user: AuthUser, body: CreateCampaignBody) {
    this.assertDb();
    PermissionService.assert(user, "campaign.create");
    if (!user.hasBrandProfile && user.role.toUpperCase() !== "BRAND" && user.role.toUpperCase() !== "ADMIN") {
      throw appError("FORBIDDEN", "Only brands can create campaigns");
    }

    const brandId = user.id;
    const campaign = await campaignRepository.createDraft({
      brandId,
      title: body.title,
      description: body.description,
      budget: body.budget,
      currency: body.currency,
      deadline: parseDeadline(body.deadline),
      platform: body.platform,
      aspectRatio: body.aspect_ratio
    });

    logger.info("Campaign created via API", { campaignId: campaign.id, service: "CampaignService" });
    void memoryService.inheritCampaignMemory(campaign.id, brandId).catch(() => undefined);
    return campaignRepository.findByIdWithAssets(campaign.id);
  }

  async update(campaignId: string, user: AuthUser, body: UpdateCampaignBody) {
    await this.getOwnedCampaign(campaignId, user);
    PermissionService.assert(user, "campaign.update");

    const existing = await campaignRepository.findById(campaignId);
    if (!existing || existing.status !== "DRAFT") {
      throw appError("CAMPAIGN_LOCKED", "Only draft campaigns can be edited");
    }

    await campaignRepository.update(campaignId, {
      title: body.title,
      description: body.description,
      budget: body.budget,
      currency: body.currency,
      deadline: body.deadline ? parseDeadline(body.deadline) : undefined,
      platform: body.platform,
      aspectRatio: body.aspect_ratio
    });

    return campaignRepository.findByIdWithAssets(campaignId);
  }

  async createDraft(input: CreateCampaignInput) {
    if (!hasDatabaseUrl()) {
      throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    }

    const campaign = await campaignRepository.createDraft(input);
    logger.info("Campaign created", { campaignId: campaign.id, service: "CampaignService" });
    return campaign;
  }

  async transition(campaignId: string, event: CampaignEventValue, actor?: AuthUser) {
    if (!hasDatabaseUrl()) {
      throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    }

    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, deletedAt: null } });
    if (!campaign) {
      throw appError("NOT_FOUND", "Campaign not found");
    }

    const current = toMachineState(campaign.status);

    return runTransition({
      machine: campaignStateMachine,
      current,
      event,
      context: {
        aggregateType: "campaign",
        aggregateId: campaignId,
        campaignId,
        actor
      },
      persist: async (next) => {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { status: next as CampaignStatus }
        });
      },
      domainEvent: {
        name: CampaignEvents.UPDATED,
        aggregateType: "campaign",
        aggregateId: campaignId,
        payload: { event, from: current }
      }
    });
  }

  // Brand wizard portal (legacy proj_* URLs)
  createBrandDraft(input: Parameters<CampaignBrandPortalService["createDraft"]>[0]) {
    return campaignBrandPortalService.createDraft(input);
  }

  getByLegacyProjectId(legacyProjectId: string) {
    return campaignBrandPortalService.getByLegacyProjectId(legacyProjectId);
  }

  listForClientEmail(clientEmail: string) {
    return campaignBrandPortalService.listForClientEmail(clientEmail);
  }

  resolveLegacyCampaignId(legacyProjectId: string) {
    return campaignBrandPortalService.resolveLegacyCampaignId(legacyProjectId);
  }

  updateBrandProject(
    legacyProjectId: string,
    patch: Parameters<CampaignBrandPortalService["updateProject"]>[1],
    options?: Parameters<CampaignBrandPortalService["updateProject"]>[2]
  ) {
    return campaignBrandPortalService.updateProject(legacyProjectId, patch, options);
  }

  completeBrandWizardStep(legacyProjectId: string, step: number, actorEmail?: string) {
    return campaignBrandPortalService.completeWizardStep(legacyProjectId, step, actorEmail);
  }

  completeBrandWizardSteps(legacyProjectId: string, steps: number[], actorEmail?: string) {
    return campaignBrandPortalService.completeWizardSteps(legacyProjectId, steps, actorEmail);
  }

  saveBrandCreativeBrief(
    legacyProjectId: string,
    brief: Parameters<CampaignBrandPortalService["saveCreativeBrief"]>[1],
    actorEmail?: string
  ) {
    return campaignBrandPortalService.saveCreativeBrief(legacyProjectId, brief, actorEmail);
  }

  publishBrandCampaign(
    legacyProjectId: string,
    actor: Parameters<CampaignBrandPortalService["publish"]>[1]
  ) {
    return campaignBrandPortalService.publish(legacyProjectId, actor);
  }

  listBrandAssets(legacyProjectId: string) {
    return campaignBrandPortalService.listAssets(legacyProjectId);
  }

  listBrandReferences(legacyProjectId: string) {
    return campaignBrandPortalService.listReferences(legacyProjectId);
  }

  getBrandCreativeBrief(legacyProjectId: string) {
    return campaignBrandPortalService.getCreativeBrief(legacyProjectId);
  }
}

type CampaignBrandPortalService = typeof campaignBrandPortalService;

export const campaignService = new CampaignService();
