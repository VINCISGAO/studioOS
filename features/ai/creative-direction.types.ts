export type CreativeDirection = {
  id: string;
  title: string;
  hook: string;
  visualStyle: string;
  tone: string;
  cta: string;
  rationale: string;
};

export type CreativeBriefJson = {
  creative_directions?: CreativeDirection[];
  selected_direction_id?: string;
  generated_at?: string;
  approved_at?: string;
  legacy_project_id?: string;
  [key: string]: unknown;
};
