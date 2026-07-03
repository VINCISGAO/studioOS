export type CreativeDirection = {
  id: string;
  title: string;
  coreIdea: string;
  hook: string;
  story: string;
  visualStyle: string;
  tone: string;
  shotList: string[];
  cta: string;
  recommendedCreatorType: string;
  recommendedBudget: string;
  expectedOutcome: string;
  rationale: string;
};

export type FrozenProductionBrief = {
  frozen_at: string;
  source_direction_id: string;
  title: string;
  core_idea: string;
  hook: string;
  story: string;
  tone: string;
  shot_list: string[];
  cta: string;
  visual_style: string;
  recommended_creator_type?: string;
  recommended_budget?: string;
  expected_outcome?: string;
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
