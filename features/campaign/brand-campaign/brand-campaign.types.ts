import type { StoredCreativeBrief } from "@/lib/campaign-types";
import type { CreativeDirection, FrozenProductionBrief } from "@/features/ai/creative-direction.types";
import type { CommercialObjective } from "@/lib/project-types";

export type BrandProductionBrief = {
  legacy_project_id: string;
  studio_id?: string;
  product?: {
    name?: string;
    url?: string;
    category?: string;
  };
  objective?: {
    type?: CommercialObjective | string;
    notes?: string;
  };
  audience?: string;
  goal?: string;
  notes?: string;
  questionnaire?: Record<string, unknown>;
  confirmed_brief?: Record<string, unknown>;
  creative_directions?: CreativeDirection[];
  selected_direction_id?: string;
  generated_at?: string;
  approved_at?: string;
  ai_job_id?: string;
  frozen_production_brief?: FrozenProductionBrief;
  creative_brief?: StoredCreativeBrief | Record<string, unknown>;
  style?: {
    brand?: string;
    presets?: string[];
  };
  delivery?: {
    video_lengths?: string[];
    aspect_ratios?: string[];
    quantity?: number;
    timeline_id?: string;
  };
  budget?: {
    range?: string;
    min?: number | null;
    max?: number | null;
  };
  creative_collaboration?: Record<string, unknown>;
  final_creative_direction?: string | null;
  confirmed_creative_direction?: Record<string, unknown> | null;
};

export type BrandCampaignSelection = {
  legacy_creator_id: string;
  invitation_id: string;
  creator_profile_id?: string;
  creator_user_id?: string;
  selected_at: string;
  selected_by_email?: string;
};

export type BrandCampaignCancellation = {
  reason?: string | null;
  cancelled_at: string;
  cancelled_by: "brand" | "studio" | "admin" | "system";
  order_id?: string | null;
};

export type BrandCampaignMemory = {
  wizard?: {
    step?: number;
    completed_steps?: number[];
    ephemeral?: boolean;
    saved_at?: string;
  };
  client?: {
    email?: string;
    name?: string;
    company_name?: string;
  };
  published_at?: string;
  visibility?: string;
  org_id?: string | null;
  pack_items?: unknown[];
  selection?: BrandCampaignSelection;
  cancellation?: BrandCampaignCancellation;
};

export type BrandCampaignActor = {
  userId?: string | null;
  email: string;
  role?: "brand" | "system";
};

export const REFERENCE_ASSET_META_KIND = "reference" as const;

export type ReferenceAssetMetadata = {
  kind: typeof REFERENCE_ASSET_META_KIND;
  source_url: string;
  note?: string;
  sort_order: number;
  platform?: string;
  reference_type?: string;
  legacy_ref_id?: string;
};

export type LegacyAssetMetadata = {
  legacy_asset_id?: string;
  role?: "original" | "preview";
};
