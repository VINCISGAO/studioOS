import type { Campaign, CampaignAsset, User } from "@prisma/client";
import type { StoredCreativeBrief, StoredProjectAsset, StoredProjectReference } from "@/lib/campaign-types";
import type { StoredProject } from "@/lib/project-types";
import { CREATIVE_COLLABORATION_SETTINGS_KEY } from "@/features/creative-collaboration/creative-collaboration.types";
import { detectReferenceType } from "@/lib/campaign/reference-type";
import {
  type BrandCampaignMemory,
  type BrandProductionBrief,
  REFERENCE_ASSET_META_KIND,
  type ReferenceAssetMetadata
} from "@/features/campaign/brand-campaign/brand-campaign.types";
import {
  prismaStatusToProjectStatus,
  readCampaignMemory,
  readProductionBrief
} from "@/features/campaign/brand-campaign/brand-campaign.utils";

type CampaignWithBrand = Campaign & {
  brand?: User & { brandProfile?: { companyName: string } | null };
  assets?: CampaignAsset[];
};

function asProductionBrief(raw: unknown): BrandProductionBrief {
  const value = readProductionBrief(raw);
  return value as BrandProductionBrief;
}

function asCampaignMemory(raw: unknown): BrandCampaignMemory {
  const value = readCampaignMemory(raw);
  return value as BrandCampaignMemory;
}

function isReferenceAsset(asset: CampaignAsset): boolean {
  const meta = asset.metadataJson as ReferenceAssetMetadata | null;
  if (meta?.kind === REFERENCE_ASSET_META_KIND) return true;
  return ["REFERENCE_VIDEO", "REFERENCE_IMAGE", "OTHER"].includes(asset.assetType) && Boolean(meta?.source_url);
}

function assetTypeToProjectAssetType(asset: CampaignAsset): StoredProjectAsset["type"] {
  if (asset.assetType === "LOGO") return "logo";
  if (asset.assetType === "BRAND_GUIDE" || asset.assetType === "PDF") return "brand_guide";
  const meta = asset.metadataJson as { role?: string } | null;
  if (asset.assetType === "PRODUCT_IMAGE" && meta?.role === "original") {
    return "product_image_original";
  }
  if (asset.assetType === "PRODUCT_IMAGE") return "product_image";
  return "product_image";
}

export function mapCampaignAssetToStoredProjectAsset(
  asset: CampaignAsset,
  legacyProjectId: string
): StoredProjectAsset {
  return {
    id: asset.id,
    project_id: legacyProjectId,
    type: assetTypeToProjectAssetType(asset),
    file_name: asset.fileName,
    file_url: asset.previewUrl ?? asset.fileKey,
    mime_type: asset.mimeType,
    size_bytes: Number(asset.fileSize),
    created_at: asset.createdAt.toISOString()
  };
}

export function mapReferenceAssetToStoredProjectReference(asset: CampaignAsset): StoredProjectReference {
  const meta = (asset.metadataJson ?? {}) as ReferenceAssetMetadata;
  const sourceUrl = meta.source_url ?? asset.previewUrl ?? "";
  const detected = detectReferenceType(sourceUrl);
  return {
    id: asset.id,
    project_id: "",
    type: (meta.reference_type as StoredProjectReference["type"]) ?? detected,
    source_url: sourceUrl,
    note: meta.note ?? "",
    platform: meta.platform ?? detected,
    sort_order: meta.sort_order ?? 0,
    created_at: asset.createdAt.toISOString()
  };
}

export function mapCampaignToStoredProject(campaign: CampaignWithBrand): StoredProject {
  const brief = asProductionBrief(campaign.productionBrief);
  const memory = asCampaignMemory(campaign.campaignMemoryJson);
  const legacyProjectId = brief.legacy_project_id ?? campaign.id;
  const questionnaire = (brief.questionnaire ?? {}) as Record<string, unknown>;
  const clientEmail =
    memory.client?.email?.toLowerCase() ?? campaign.brand?.email?.toLowerCase() ?? "";
  const companyName =
    memory.client?.company_name ??
    campaign.brand?.brandProfile?.companyName ??
    memory.client?.name ??
    "";
  const referenceAssets = (campaign.assets ?? []).filter(isReferenceAsset);
  const referenceLinks = referenceAssets
    .map((asset) => mapReferenceAssetToStoredProjectReference(asset).source_url)
    .filter(Boolean)
    .join("\n");

  const aspectRatios =
    brief.delivery?.aspect_ratios ??
    (campaign.aspectRatio ? [campaign.aspectRatio] : []);
  const budgetRange = brief.budget?.range ?? `$${Number(campaign.budget)}`;

  return {
    id: legacyProjectId,
    org_id: memory.org_id ?? null,
    created_by: campaign.createdBy ?? clientEmail,
    client_email: clientEmail,
    client_name: memory.client?.name ?? campaign.brand?.fullName ?? clientEmail.split("@")[0],
    company_name: companyName,
    title: campaign.title,
    status: prismaStatusToProjectStatus(campaign.status),
    wizard_step: memory.wizard?.step ?? 1,
    wizard_completed_steps: memory.wizard?.completed_steps ?? [],
    visibility: (memory.visibility as StoredProject["visibility"]) ?? "invite_only",
    settings_json: {
      brand_questionnaire: questionnaire,
      confirmed_brief: brief.confirmed_brief,
      frozen_production_brief: brief.frozen_production_brief,
      selected_direction_id: brief.selected_direction_id,
      wizard_ephemeral: memory.wizard?.ephemeral === true,
      wizard_saved_at: memory.wizard?.saved_at,
      ...(brief.creative_collaboration
        ? { [CREATIVE_COLLABORATION_SETTINGS_KEY]: brief.creative_collaboration }
        : {}),
      ...(brief.final_creative_direction
        ? { final_creative_direction: brief.final_creative_direction }
        : {}),
      ...(brief.confirmed_creative_direction
        ? { confirmed_creative_direction: brief.confirmed_creative_direction }
        : {}),
      ...(memory.cancellation ? { cancellation: memory.cancellation } : {}),
      prisma_campaign_id: campaign.id
    },
    product_url: brief.product?.url ?? "",
    product_name: brief.product?.name ?? "",
    commercial_objective: (brief.objective?.type as StoredProject["commercial_objective"]) ?? "",
    commercial_objective_note: brief.objective?.notes ?? "",
    category: brief.product?.category ?? "",
    target_market: [],
    target_audience: brief.audience ?? "",
    style_presets: brief.style?.presets ?? [],
    video_lengths: brief.delivery?.video_lengths ?? [],
    aspect_ratios: aspectRatios,
    output_quantity: brief.delivery?.quantity ?? 0,
    budget_range: budgetRange,
    budget_min: brief.budget?.min ?? null,
    budget_max: brief.budget?.max ?? null,
    deadline: campaign.deadline.toISOString().slice(0, 10),
    selected_studio_id: memory.selection?.legacy_creator_id ?? brief.studio_id ?? null,
    published_at: memory.published_at ?? null,
    email: clientEmail,
    target_platform: campaign.platform ?? "",
    video_format: campaign.aspectRatio ?? aspectRatios[0] ?? "",
    video_count: brief.delivery?.quantity ?? 0,
    brand_style: brief.style?.brand ?? "",
    reference_links: referenceLinks,
    campaign_goal: brief.goal ?? campaign.description ?? "",
    notes: brief.notes ?? "",
    updated_at: campaign.updatedAt.toISOString(),
    created_at: campaign.createdAt.toISOString()
  };
}

export function listStoredAssets(campaign: CampaignWithBrand): StoredProjectAsset[] {
  const legacyProjectId =
    asProductionBrief(campaign.productionBrief).legacy_project_id ?? campaign.id;
  return (campaign.assets ?? [])
    .filter((asset) => !isReferenceAsset(asset))
    .map((asset) => mapCampaignAssetToStoredProjectAsset(asset, legacyProjectId));
}

export function listStoredReferences(campaign: CampaignWithBrand): StoredProjectReference[] {
  const legacyProjectId =
    asProductionBrief(campaign.productionBrief).legacy_project_id ?? campaign.id;
  return (campaign.assets ?? [])
    .filter(isReferenceAsset)
    .map((asset) => ({
      ...mapReferenceAssetToStoredProjectReference(asset),
      project_id: legacyProjectId
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function readStoredCreativeBrief(campaign: Campaign): StoredCreativeBrief | null {
  const brief = asProductionBrief(campaign.productionBrief);
  const creative = brief.creative_brief;
  if (!creative || typeof creative !== "object") {
    return null;
  }
  return creative as StoredCreativeBrief;
}
