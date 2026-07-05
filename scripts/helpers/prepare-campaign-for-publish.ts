/**
 * Test helper — advance a wizard draft to CREATIVE_APPROVED with frozen Production Brief.
 * Used by Prisma verify scripts before campaignBrandPortalService.publish().
 */
import type { CampaignStatus } from "@prisma/client";
import type { BrandProductionBrief } from "../../features/campaign/brand-campaign/brand-campaign.types";
import { readProductionBrief } from "../../features/campaign/brand-campaign/brand-campaign.utils";
import { campaignRepository } from "../../features/campaign/campaign.repository";
import { CampaignState } from "../../features/campaign/campaign.state-machine";
import type { FrozenProductionBrief } from "../../features/ai/creative-direction.types";

export function verifyConfirmedBrief() {
  return {
    confirmed_at: new Date().toISOString(),
    fields: [{ section: "verify", label: "Goal", value: "Automated verify" }],
    full_text: "Automated verify confirmed brief"
  };
}

export function verifyFrozenProductionBrief(): FrozenProductionBrief {
  const now = new Date().toISOString();
  return {
    frozen_at: now,
    source_direction_id: "dir_verify",
    title: "Verify Creative Direction",
    core_idea: "Automated transaction verify",
    hook: "Open on product hero shot",
    story: "Problem → solution → social proof → CTA",
    tone: "Confident and direct",
    shot_list: ["Hero", "Feature", "CTA"],
    cta: "Shop now",
    visual_style: "Clean studio lighting",
    full_text: "Automated verify — frozen Production Brief for publish gate."
  };
}

export async function prepareCampaignForPublish(input: {
  campaignId: string;
  legacyProjectId: string;
  brandUserId: string;
  productionBrief?: BrandProductionBrief;
}) {
  const existing =
    input.productionBrief ??
    (readProductionBrief(
      (await campaignRepository.findById(input.campaignId))?.productionBrief
    ) as BrandProductionBrief);

  const frozen = verifyFrozenProductionBrief();

  await campaignRepository.updateBrandCampaign(input.campaignId, {
    productionBrief: {
      ...existing,
      legacy_project_id: input.legacyProjectId,
      confirmed_brief: verifyConfirmedBrief(),
      frozen_production_brief: frozen,
      selected_direction_id: frozen.source_direction_id,
      approved_at: frozen.frozen_at
    },
    status: CampaignState.CREATIVE_APPROVED as CampaignStatus
  });

  const byId = await campaignRepository.findById(input.campaignId);
  const byLegacy = await campaignRepository.findByLegacyProjectId(input.legacyProjectId);
  const row = byLegacy ?? byId;
  if (!row) {
    throw new Error("campaign not found after prepare");
  }

  const brief = readProductionBrief(row.productionBrief) as BrandProductionBrief;
  if (row.status !== CampaignState.CREATIVE_APPROVED) {
    throw new Error(`Expected CREATIVE_APPROVED, got ${row.status}`);
  }
  if (!brief.frozen_production_brief?.full_text?.trim()) {
    throw new Error("frozen_production_brief missing after prepare");
  }

  return {
    status: row.status,
    hasFrozenBrief: true
  };
}
