export type CreativeDirection = {
  id: string;
  title: string;
  hook: string;
  story: string;
  visualStyle: string;
  tone: string;
  shotList: string[];
  cta: string;
  rationale: string;
};

export type FrozenProductionBrief = {
  frozen_at: string;
  source_direction_id: string;
  title: string;
  hook: string;
  story: string;
  tone: string;
  shot_list: string[];
  cta: string;
  visual_style: string;
  product?: {
    name?: string;
    url?: string;
    category?: string;
  };
  audience?: string;
  platforms?: string;
  budget_range?: string;
  delivery?: Record<string, unknown>;
  full_text: string;
};

export type CreativeBriefJson = {
  creative_directions?: CreativeDirection[];
  selected_direction_id?: string;
  frozen_production_brief?: FrozenProductionBrief;
  generated_at?: string;
  approved_at?: string;
  legacy_project_id?: string;
  [key: string]: unknown;
};
