import type { StoredCreativeBrief, StoredProjectAsset, StoredProjectReference } from "@/lib/campaign-types";
import type { CreateProjectDraftInput, StoredProject, UpdateProjectInput } from "@/lib/project-types";
import { CREATIVE_COLLABORATION_SETTINGS_KEY } from "@/features/creative-collaboration/creative-collaboration.types";
import { activityService } from "@/features/campaign/activity.service";
import {
  listStoredAssets,
  listStoredReferences,
  mapCampaignToStoredProject,
  readStoredCreativeBrief
} from "@/features/campaign/brand-campaign/brand-campaign.mapper";
import type {
  BrandCampaignMemory,
  BrandProductionBrief
} from "@/features/campaign/brand-campaign/brand-campaign.types";
import {
  createLegacyProjectId,
  parseBudget,
  parseDeadline,
  readCampaignMemory,
  readProductionBrief
} from "@/features/campaign/brand-campaign/brand-campaign.utils";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { CampaignEvent, campaignStateMachine } from "@/features/campaign/campaign.state-machine";
import { userRepository } from "@/features/auth/user.repository";
import { CampaignEvents } from "@/features/shared/types/events";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";
import { runTransition } from "@/lib/core/transition-runner";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mergeBrief(existing: unknown, patch: UpdateProjectInput): BrandProductionBrief {
  const brief = readProductionBrief(existing) as BrandProductionBrief;
  const settings = (patch.settings_json ?? {}) as Record<string, unknown>;
  const questionnaire = asRecord(settings.brand_questionnaire ?? brief.questionnaire);

  return {
    ...brief,
    product: {
      ...brief.product,
      ...(patch.product_name !== undefined ? { name: patch.product_name } : {}),
      ...(patch.product_url !== undefined ? { url: patch.product_url } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {})
    },
    objective: {
      ...brief.objective,
      ...(patch.commercial_objective !== undefined ? { type: patch.commercial_objective } : {}),
      ...(patch.commercial_objective_note !== undefined ? { notes: patch.commercial_objective_note } : {})
    },
    audience: patch.target_audience ?? brief.audience,
    goal: patch.campaign_goal ?? brief.goal,
    notes: patch.notes ?? brief.notes,
    questionnaire,
    confirmed_brief:
      (settings.confirmed_brief as Record<string, unknown> | undefined) ?? brief.confirmed_brief,
    style: {
      ...brief.style,
      ...(patch.brand_style !== undefined ? { brand: patch.brand_style } : {}),
      ...(patch.style_presets !== undefined ? { presets: patch.style_presets } : {})
    },
    delivery: {
      ...brief.delivery,
      ...(patch.video_lengths !== undefined ? { video_lengths: patch.video_lengths } : {}),
      ...(patch.aspect_ratios !== undefined ? { aspect_ratios: patch.aspect_ratios } : {}),
      ...(patch.output_quantity !== undefined ? { quantity: patch.output_quantity } : {}),
      ...(patch.video_count !== undefined ? { quantity: patch.video_count } : {}),
      ...(questionnaire.deliveryTimeline
        ? { timeline_id: String(questionnaire.deliveryTimeline) }
        : {})
    },
    budget: {
      ...brief.budget,
      ...(patch.budget_range !== undefined ? { range: patch.budget_range } : {}),
      ...(patch.budget_min !== undefined ? { min: patch.budget_min } : {}),
      ...(patch.budget_max !== undefined ? { max: patch.budget_max } : {})
    },
    ...(settings[CREATIVE_COLLABORATION_SETTINGS_KEY] !== undefined
      ? { creative_collaboration: asRecord(settings[CREATIVE_COLLABORATION_SETTINGS_KEY]) }
      : {}),
    ...(settings.final_creative_direction !== undefined
      ? {
          final_creative_direction:
            typeof settings.final_creative_direction === "string"
              ? settings.final_creative_direction
              : null
        }
      : {}),
    ...(settings.confirmed_creative_direction !== undefined
      ? {
          confirmed_creative_direction:
            settings.confirmed_creative_direction &&
            typeof settings.confirmed_creative_direction === "object"
              ? asRecord(settings.confirmed_creative_direction)
              : null
        }
      : {})
  };
}

function mergeMemory(existing: unknown, patch: UpdateProjectInput): BrandCampaignMemory {
  const memory = readCampaignMemory(existing) as BrandCampaignMemory;
  const settings = (patch.settings_json ?? {}) as Record<string, unknown>;
  const { published_at: existingPublishedAt, ...memoryWithoutPublishedAt } = memory;

  return {
    ...memoryWithoutPublishedAt,
    ...(existingPublishedAt != null ? { published_at: existingPublishedAt } : {}),
    wizard: {
      ...memory.wizard,
      ...(patch.wizard_step !== undefined ? { step: patch.wizard_step } : {}),
      ...(patch.wizard_completed_steps !== undefined
        ? { completed_steps: patch.wizard_completed_steps }
        : {}),
      ...(settings.wizard_ephemeral !== undefined
        ? { ephemeral: settings.wizard_ephemeral === true }
        : {}),
      ...(settings.wizard_saved_at !== undefined
        ? { saved_at: String(settings.wizard_saved_at) }
        : {})
    },
    ...(patch.published_at !== undefined
      ? { published_at: patch.published_at ?? undefined }
      : {}),
    ...(patch.visibility !== undefined ? { visibility: patch.visibility } : {}),
    ...(patch.org_id !== undefined ? { org_id: patch.org_id } : {})
  };
}

function isWizardMetadataPatch(patch: UpdateProjectInput): boolean {
  const keys = Object.keys(patch);
  return keys.length > 0 && keys.every((key) => ["settings_json", "wizard_step", "wizard_completed_steps"].includes(key));
}

const BRAND_WIZARD_EDIT_STATUSES = ["DRAFT", "AI_PROCESSING", "CREATIVE_READY", "CREATIVE_APPROVED"] as const;
const BRAND_WIZARD_METADATA_STATUSES = [
  ...BRAND_WIZARD_EDIT_STATUSES,
  "ESCROW_PENDING"
] as const;

const BRAND_CREATIVE_COLLABORATION_STATUSES = [
  "ESCROW_FUNDED",
  "MATCHING",
  "INVITATION_SENT",
  "CREATOR_ACCEPTED",
  "PRODUCING",
  "UNDER_REVIEW",
  "APPROVED",
  "MASTER_UPLOADED"
] as const;

function isCreativeCollaborationPatch(patch: UpdateProjectInput): boolean {
  if (!isWizardMetadataPatch(patch)) return false;
  const settings = patch.settings_json;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return false;
  return CREATIVE_COLLABORATION_SETTINGS_KEY in settings;
}

/** Step 1 setup saves questionnaire + product fields while the user is still in the wizard. */
function isBrandWizardSetupPatch(patch: UpdateProjectInput): boolean {
  if (isWizardMetadataPatch(patch)) return true;
  const settings = patch.settings_json as Record<string, unknown> | undefined;
  return Boolean(settings && "brand_questionnaire" in settings);
}

/** Brand wizard portal — legacy `proj_*` URLs mapped to Prisma campaigns. */
export class CampaignBrandPortalService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  private async loadCampaignForStatuses(legacyProjectId: string, allowedStatuses: string[]) {
    const campaign = await campaignRepository.findByLegacyProjectIdWithRelations(legacyProjectId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    if (!allowedStatuses.includes(campaign.status)) {
      throw new Error(
        allowedStatuses.length === 1 && allowedStatuses[0] === "DRAFT"
          ? "Only draft campaigns can be edited"
          : `Campaign status ${campaign.status} cannot update wizard metadata`
      );
    }
    return campaign;
  }

  private async loadDraftCampaign(legacyProjectId: string) {
    return this.loadCampaignForStatuses(legacyProjectId, ["DRAFT"]);
  }

  async createDraft(input: CreateProjectDraftInput): Promise<StoredProject | null> {
    if (!this.isEnabled()) return null;

    const user = await userRepository.ensureBrandPortalUser({
      email: input.client_email,
      fullName: input.client_name,
      companyName: input.company_name
    });
    if (!user) {
      return null;
    }

    const legacyProjectId = createLegacyProjectId();
    const title = input.title ?? `${input.company_name} Campaign`;

    const campaign = await campaignRepository.createBrandWizardDraft({
      brandId: user.id,
      legacyProjectId,
      title,
      client: {
        email: input.client_email,
        name: input.client_name,
        company_name: input.company_name
      },
      wizardEphemeral: input.wizard_ephemeral
    });

    try {
      await activityService.write(campaign.id, "brand_campaign.created", {
        userId: user.id,
        email: input.client_email,
        role: "brand"
      }, {
        legacy_project_id: legacyProjectId,
        ephemeral: input.wizard_ephemeral === true
      });
    } catch (error) {
      logger.error("brand_campaign.created activity log failed", {
        service: "campaign-brand",
        campaignId: campaign.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return mapCampaignToStoredProject(campaign);
  }

  async resolvePrismaCampaignId(legacyProjectId: string): Promise<string | null> {
    return this.resolveLegacyCampaignId(legacyProjectId);
  }

  async getByLegacyProjectId(legacyProjectId: string): Promise<StoredProject | null> {
    if (!this.isEnabled()) return null;
    const campaign = await campaignRepository.findByLegacyProjectIdWithRelations(legacyProjectId);
    if (!campaign) return null;
    return mapCampaignToStoredProject(campaign);
  }

  async getByProjectOrCampaignId(projectOrCampaignId: string): Promise<StoredProject | null> {
    if (!this.isEnabled()) return null;
    const campaign =
      (await campaignRepository.findByLegacyProjectIdWithRelations(projectOrCampaignId)) ??
      (await campaignRepository.findByIdWithBrandAndAssets(projectOrCampaignId));
    if (!campaign) return null;
    return mapCampaignToStoredProject(campaign);
  }

  async listForClientEmail(clientEmail: string): Promise<StoredProject[]> {
    if (!this.isEnabled()) return [];
    const campaigns = await campaignRepository.listByBrandEmail(clientEmail);
    return campaigns.map(mapCampaignToStoredProject);
  }

  async resolveLegacyCampaignId(legacyProjectId: string): Promise<string | null> {
    if (!this.isEnabled()) return null;
    const campaign = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    return campaign?.id ?? null;
  }

  async listAssets(legacyProjectId: string): Promise<StoredProjectAsset[]> {
    if (!this.isEnabled()) return [];
    const campaign = await campaignRepository.findByLegacyProjectIdWithRelations(legacyProjectId);
    if (!campaign) return [];
    return listStoredAssets(campaign);
  }

  async listReferences(legacyProjectId: string): Promise<StoredProjectReference[]> {
    if (!this.isEnabled()) return [];
    const campaign = await campaignRepository.findByLegacyProjectIdWithRelations(legacyProjectId);
    if (!campaign) return [];
    return listStoredReferences(campaign);
  }

  async getCreativeBrief(legacyProjectId: string): Promise<StoredCreativeBrief | null> {
    if (!this.isEnabled()) return null;
    const campaign = await campaignRepository.findByLegacyProjectIdWithRelations(legacyProjectId);
    if (!campaign) return null;
    return readStoredCreativeBrief(campaign);
  }

  async updateProject(
    legacyProjectId: string,
    patch: UpdateProjectInput,
    options?: { action?: string; actorEmail?: string }
  ): Promise<StoredProject | null> {
    if (!this.isEnabled()) return null;

    const allowedStatuses = isCreativeCollaborationPatch(patch)
      ? [...BRAND_WIZARD_METADATA_STATUSES, ...BRAND_CREATIVE_COLLABORATION_STATUSES]
      : isWizardMetadataPatch(patch)
        ? [...BRAND_WIZARD_METADATA_STATUSES]
        : isBrandWizardSetupPatch(patch)
          ? [...BRAND_WIZARD_EDIT_STATUSES]
          : ["DRAFT"];
    const campaign = await this.loadCampaignForStatuses(legacyProjectId, allowedStatuses);
    const productionBrief = mergeBrief(campaign.productionBrief, patch);
    const campaignMemory = mergeMemory(campaign.campaignMemoryJson, patch);

    const updated = await campaignRepository.updateBrandCampaign(campaign.id, {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.campaign_goal !== undefined || patch.notes !== undefined
        ? { description: patch.campaign_goal ?? patch.notes ?? campaign.description ?? undefined }
        : {}),
      ...(patch.budget_range !== undefined ? { budget: parseBudget(patch.budget_range) } : {}),
      ...(patch.deadline !== undefined ? { deadline: parseDeadline(patch.deadline) } : {}),
      ...(patch.target_platform !== undefined ? { platform: patch.target_platform } : {}),
      ...(patch.video_format !== undefined
        ? { aspectRatio: patch.video_format }
        : patch.aspect_ratios?.[0]
          ? { aspectRatio: patch.aspect_ratios[0] }
          : {}),
      productionBrief,
      campaignMemoryJson: campaignMemory
    });

    if (options?.action) {
      await activityService.write(
        campaign.id,
        options.action,
        { userId: campaign.brandId, email: options.actorEmail ?? campaign.brand.email, role: "brand" },
        { legacy_project_id: legacyProjectId }
      );
    }

    return mapCampaignToStoredProject(updated);
  }

  async completeWizardStep(legacyProjectId: string, step: number, actorEmail?: string) {
    return this.completeWizardSteps(legacyProjectId, [step], actorEmail);
  }

  async completeWizardSteps(legacyProjectId: string, steps: number[], actorEmail?: string) {
    if (!this.isEnabled() || steps.length === 0) return null;
    const campaign = await this.loadCampaignForStatuses(legacyProjectId, [...BRAND_WIZARD_METADATA_STATUSES]);
    const memory = readCampaignMemory(campaign.campaignMemoryJson) as BrandCampaignMemory;
    const completed = new Set(memory.wizard?.completed_steps ?? []);
    for (const step of steps) {
      completed.add(step);
    }
    const maxStep = Math.max(...steps);
    const wizardStep = Math.max(memory.wizard?.step ?? 1, Math.min(7, maxStep + 1));

    return this.updateProject(
      legacyProjectId,
      {
        wizard_step: wizardStep,
        wizard_completed_steps: [...completed].sort((a, b) => a - b)
      },
      { action: "brand_campaign.step_completed", actorEmail }
    );
  }

  async saveCreativeBrief(legacyProjectId: string, brief: StoredCreativeBrief, actorEmail?: string) {
    if (!this.isEnabled()) return null;
    const campaign = await this.loadDraftCampaign(legacyProjectId);
    const productionBrief = {
      ...(readProductionBrief(campaign.productionBrief) as BrandProductionBrief),
      creative_brief: brief
    };
    const updated = await campaignRepository.updateBrandCampaign(campaign.id, {
      productionBrief,
      ...(brief.executive_summary ? { description: brief.executive_summary } : {})
    });
    await activityService.write(
      campaign.id,
      "brand_campaign.creative_brief_saved",
      { userId: campaign.brandId, email: actorEmail ?? campaign.brand.email, role: "brand" },
      { legacy_project_id: legacyProjectId, version: brief.version }
    );
    return mapCampaignToStoredProject(updated);
  }

  async publish(
    legacyProjectId: string,
    actor: { email: string; userId?: string | null }
  ): Promise<StoredProject | null> {
    if (!this.isEnabled()) return null;

    const campaign = await campaignRepository.findByLegacyProjectIdWithRelations(legacyProjectId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    if (campaign.status !== "CREATIVE_APPROVED") {
      throw new Error("Approve a Creative Direction before publishing");
    }

    const brief = readProductionBrief(campaign.productionBrief) as BrandProductionBrief;
    if (!brief.frozen_production_brief?.full_text?.trim()) {
      throw new Error("Frozen Production Brief required before publish");
    }

    const memory = readCampaignMemory(campaign.campaignMemoryJson) as BrandCampaignMemory;
    const publishedAt = new Date().toISOString();

    await campaignRepository.updateBrandCampaign(campaign.id, {
      campaignMemoryJson: {
        ...memory,
        wizard: {
          ...memory.wizard,
          ephemeral: false
        },
        published_at: publishedAt
      }
    });

    await runTransition({
      machine: campaignStateMachine,
      current: "CREATIVE_APPROVED",
      event: CampaignEvent.PUBLISH,
      context: {
        aggregateType: "campaign",
        aggregateId: campaign.id,
        campaignId: campaign.id,
        actor: actor.userId ? { id: actor.userId, role: "BRAND" } : undefined
      },
      persist: async (next) => {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: next }
        });
      },
      domainEvent: {
        name: CampaignEvents.UPDATED,
        aggregateType: "campaign",
        aggregateId: campaign.id,
        payload: { event: CampaignEvent.PUBLISH, from: "CREATIVE_APPROVED", legacy_project_id: legacyProjectId }
      }
    });

    await activityService.write(
      campaign.id,
      "brand_campaign.published",
      { userId: actor.userId ?? campaign.brandId, email: actor.email, role: "brand" },
      {
        legacy_project_id: legacyProjectId,
        from_status: "CREATIVE_APPROVED",
        to_status: "ESCROW_PENDING"
      }
    );

    const { notifyBrandRequirementPublished } = await import(
      "@/lib/studioos/commercial-interaction-notify"
    );
    await notifyBrandRequirementPublished({
      brandEmail: actor.email,
      projectId: legacyProjectId,
      projectTitle: campaign.title || "Project",
      locale: "zh"
    }).catch(() => undefined);

    const updated = await campaignRepository.findByLegacyProjectIdWithRelations(legacyProjectId);
    const mapped = updated ? mapCampaignToStoredProject(updated) : null;
    if (mapped) {
      const { preparePublishedCampaignCheckout } = await import("@/lib/studioos/brand-checkout-service");
      await preparePublishedCampaignCheckout({
        project: mapped,
        client: {
          client_email: actor.email,
          client_name: memory.client?.name ?? campaign.brand?.fullName ?? actor.email.split("@")[0],
          company_name:
            memory.client?.company_name ??
            campaign.brand?.brandProfile?.companyName ??
            memory.client?.name ??
            "Brand"
        },
        locale: "zh"
      }).catch((error) => {
        logger.warn("Legacy checkout setup after publish failed", {
          service: "campaign-brand",
          legacyProjectId,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }
    return mapped;
  }
}

export const campaignBrandPortalService = new CampaignBrandPortalService();
