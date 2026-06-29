export type ProjectAssetType = "logo" | "product_image" | "product_image_original" | "brand_guide";

export type ReferenceType =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "pinterest"
  | "behance"
  | "mp4"
  | "image"
  | "link";

export type PackItemType =
  | "brief"
  | "storyboard"
  | "shot_list"
  | "moodboard"
  | "prompt_package"
  | "script"
  | "voice_style"
  | "music_style"
  | "subtitle_style"
  | "cta_suggestions";

export type StoredProjectAsset = {
  id: string;
  project_id: string;
  type: ProjectAssetType;
  file_name: string;
  file_url: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export type StoredProjectReference = {
  id: string;
  project_id: string;
  type: ReferenceType;
  source_url: string;
  note: string;
  platform: string;
  sort_order: number;
  created_at: string;
};

export type StoredCreativeBrief = {
  id: string;
  project_id: string;
  version: number;
  visual_style: string;
  editing_rhythm: string;
  color_palette: { primary: string[]; mood: string };
  camera_language: string;
  music_style: string;
  subtitle_style: string;
  hook_style: string;
  brand_tone: string;
  target_audience: string;
  commercial_objective: string;
  competitor_style: string;
  executive_summary: string;
  full_brief_md: string;
  confidence_score: number;
  ai_model: string;
  created_at: string;
};

export type StoredCreativePackItem = {
  id: string;
  project_id: string;
  type: PackItemType;
  content_json: Record<string, unknown>;
  version: number;
  ai_generated: boolean;
  human_edited: boolean;
  created_at: string;
  updated_at: string;
};

export type CampaignStore = {
  assets: StoredProjectAsset[];
  references: StoredProjectReference[];
  briefs: StoredCreativeBrief[];
  pack_items: StoredCreativePackItem[];
};
