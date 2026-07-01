import type { UpdateProjectInput, StoredProject } from "@/lib/project-types";
import type { BrandCampaignMemory, BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";
import { brandCampaignActivityService } from "@/features/campaign/brand-campaign/brand-campaign-activity.service";
import { mapCampaignToStoredProject } from "@/features/campaign/brand-campaign/brand-campaign.mapper";
import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import {
  parseBudget,
  parseDeadline,
  readCampaignMemory,
  readProductionBrief
} from "@/features/campaign/brand-campaign/brand-campaign.utils";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { StoredCreativeBrief } from "@/lib/campaign-types";

function mergeBrief(existing: unknown, patch: UpdateProjectInput): BrandProductionBrief {
  const brief = readProductionBrief(existing) as BrandProductionBrief;
  const settings = (patch.settings_json ?? {}) as Record<string, unknown>;
  const questionnaire = (settings.brand_questionnaire ?? brief.questionnaire) as Record<string, unknown>;

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
    }
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

export class BrandCampaignSaveService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  private async loadCampaign(legacyProjectId: string) {
    const campaign = await brandCampaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    if (campaign.status !== "DRAFT") {
      throw new Error("Only draft campaigns can be edited");
    }
    return campaign;
  }

  async updateProject(
    legacyProjectId: string,
    patch: UpdateProjectInput,
    options?: { action?: string; actorEmail?: string }
  ): Promise<StoredProject | null> {
    if (!this.isEnabled()) return null;

    const campaign = await this.loadCampaign(legacyProjectId);
    const productionBrief = mergeBrief(campaign.productionBrief, patch);
    const campaignMemory = mergeMemory(campaign.campaignMemoryJson, patch);

    const updated = await brandCampaignRepository.updateCampaign(campaign.id, {
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
      await brandCampaignActivityService.log(
        campaign.id,
        options.action,
        { userId: campaign.brandId, email: options.actorEmail ?? campaign.brand.email, role: "brand" },
        { legacy_project_id: legacyProjectId }
      );
    }

    return mapCampaignToStoredProject(updated);
  }

  async completeWizardStep(legacyProjectId: string, step: number, actorEmail?: string) {
    if (!this.isEnabled()) return null;
    const campaign = await this.loadCampaign(legacyProjectId);
    const memory = readCampaignMemory(campaign.campaignMemoryJson) as BrandCampaignMemory;
    const completed = new Set(memory.wizard?.completed_steps ?? []);
    completed.add(step);
    const wizardStep = Math.max(memory.wizard?.step ?? 1, Math.min(7, step + 1));

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
    const campaign = await this.loadCampaign(legacyProjectId);
    const productionBrief = {
      ...(readProductionBrief(campaign.productionBrief) as BrandProductionBrief),
      creative_brief: brief
    };
    const updated = await brandCampaignRepository.updateCampaign(campaign.id, {
      productionBrief,
      ...(brief.executive_summary ? { description: brief.executive_summary } : {})
    });
    await brandCampaignActivityService.log(
      campaign.id,
      "brand_campaign.creative_brief_saved",
      { userId: campaign.brandId, email: actorEmail ?? campaign.brand.email, role: "brand" },
      { legacy_project_id: legacyProjectId, version: brief.version }
    );
    return mapCampaignToStoredProject(updated);
  }
}

export const brandCampaignSaveService = new BrandCampaignSaveService();
