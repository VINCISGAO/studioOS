export type HookType = "first_person" | "product_macro" | "question" | "ugc_handheld" | "voiceover";

export type CreativePerformanceRecord = {
  id: string;
  org_id: string;
  project_id: string | null;
  order_id: string;
  deliverable_id: string;
  deliverable_version: number;
  name: string;
  tags: {
    hook_type: HookType;
    length_sec: number;
    aspect_ratio: string;
    style_presets: string[];
    studio_id: string;
    category: string;
  };
  platform: "meta" | "tiktok" | "youtube" | "manual";
  platform_ad_id: string;
  platform_campaign_id: string;
  spend_usd: number;
  impressions: number;
  metrics: {
    ctr: number;
    hook_score: number;
    completion_rate: number;
    watch_time_sec: number;
    engagement_rate: number;
    conversion_rate: number;
    roas: number | null;
  };
  synced_at: string;
  window: "7d" | "30d";
  /** How this record was created — platform upload vs manual entry. */
  source_type?: "manual" | "platform_upload";
  upload_file_name?: string;
  ai_summary?: { en: string; zh: string };
  ai_insights?: { en: string[]; zh: string[] };
  campaign_recommendations?: { en: string[]; zh: string[] };
  analysis_source?: "heuristic" | "openai" | "vision";
};

export type StoredCreativeInsight = {
  id: string;
  org_id: string;
  category: "hook" | "length" | "style" | "cta" | "studio";
  pattern: string;
  title: { en: string; zh: string };
  body: { en: string; zh: string };
  lift_pct: number;
  sample_size: number;
  confidence: number;
  applies_to: { category?: string; platform?: string };
  generated_at: string;
};

export type CreativeDnaProfile = {
  org_id: string;
  version: number;
  fields: Record<string, string | string[]>;
  learned_from_project_ids: string[];
  learned_from_record_ids: string[];
  updated_at: string;
};

export type WizardIntelligencePrefill = {
  style_presets: string[];
  video_lengths: string[];
  aspect_ratios: string[];
  hook_style: string;
  insights: StoredCreativeInsight[];
  dna_version: number;
  source: "dna" | "insight" | "none";
};

export type PerformanceStore = {
  records: CreativePerformanceRecord[];
  insights: StoredCreativeInsight[];
  dna_profiles: CreativeDnaProfile[];
};
