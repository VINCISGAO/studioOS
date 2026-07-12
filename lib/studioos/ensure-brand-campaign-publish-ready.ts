import "server-only";

import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import type { BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";
import { readProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import { getProject } from "@/lib/project-service";
import type { Locale } from "@/lib/i18n";
import type { ConfirmedBriefSnapshot } from "@/lib/studioos/confirmed-brief";

const PUBLISH_ERROR_ZH: Record<string, string> = {
  "Approve a Creative Direction before publishing": "请先确认创意方向后再发布",
  "Frozen Production Brief required before publish": "请先确认并冻结制作需求后再发布",
  "Frozen Production Brief was not generated": "制作需求尚未冻结，请返回上一步确认创意方向",
  "Campaign not found": "未找到 Campaign",
  "Creative direction not found": "未找到所选创意方向，请返回上一步重新选择"
};

export function localizePublishError(message: string, locale: Locale): string {
  if (locale !== "zh") return message;
  return PUBLISH_ERROR_ZH[message] ?? message;
}

export async function ensureCampaignPublishReady(input: {
  projectId: string;
  locale: Locale;
  actor: { email: string; userId?: string | null; role?: string };
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const campaign = await brandCampaignRepository.findByLegacyProjectId(input.projectId).catch(() => null);
  if (!campaign) {
    return { ok: true };
  }

  const project = await getProject(input.projectId);
  if (!project) {
    return { ok: false, error: input.locale === "zh" ? "项目不存在" : "Project not found" };
  }

  const settings = project.settings_json ?? {};
  const frozenFromSettings = settings.frozen_production_brief as
    | BrandProductionBrief["frozen_production_brief"]
    | undefined;
  const confirmedFromProject = settings.confirmed_brief as ConfirmedBriefSnapshot | undefined;
  const frozenFromProject = frozenFromSettings ?? confirmedFromProject;

  const brief = readProductionBrief(campaign.productionBrief) as BrandProductionBrief;
  const frozenOnCampaign = brief.frozen_production_brief?.full_text?.trim();
  const frozenOnProject = frozenFromProject?.full_text?.trim();

  if (!frozenOnCampaign && frozenOnProject) {
    const syncedFrozen = (frozenFromSettings ?? confirmedFromProject) as BrandProductionBrief["frozen_production_brief"];
    await brandCampaignRepository.updateCampaign(campaign.id, {
      productionBrief: {
        ...brief,
        frozen_production_brief: syncedFrozen,
        selected_direction_id:
          brief.selected_direction_id ?? (settings.selected_direction_id as string | undefined)
      }
    });
    brief.frozen_production_brief = syncedFrozen;
  }

  const hasFrozenBrief = Boolean(
    (brief.frozen_production_brief ?? frozenFromProject)?.full_text?.trim()
  );
  if (!hasFrozenBrief) {
    return {
      ok: false,
      error: localizePublishError("Frozen Production Brief required before publish", input.locale)
    };
  }

  const campaignStatus = campaign.status;
  if (
    campaignStatus === CampaignState.CREATIVE_APPROVED ||
    campaignStatus === CampaignState.ESCROW_PENDING
  ) {
    return { ok: true };
  }

  if (
    campaignStatus === CampaignState.CREATIVE_READY ||
    campaignStatus === CampaignState.DRAFT
  ) {
    try {
      const actor = input.actor.userId
        ? { id: input.actor.userId, role: (input.actor.role ?? "BRAND") as "BRAND" }
        : undefined;
      await campaignService.transition(campaign.id, CampaignEvent.APPROVE_CREATIVE, actor);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Approve a Creative Direction before publishing";
      return { ok: false, error: localizePublishError(message, input.locale) };
    }
  }

  return {
    ok: false,
    error: localizePublishError("Approve a Creative Direction before publishing", input.locale)
  };
}
