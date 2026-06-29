import type { CampaignProjectStatus } from "@/lib/studioos/project-status";

export type CommercialObjective = "launch" | "scale" | "test" | "seasonal" | "other" | "";

export type ProjectVisibility = "invite_only" | "private_link";

export type StoredProject = {
  id: string;
  org_id: string | null;
  created_by: string | null;
  client_email: string;
  client_name: string;
  company_name: string;
  title: string;
  status: CampaignProjectStatus;
  wizard_step: number;
  wizard_completed_steps: number[];
  visibility: ProjectVisibility;
  settings_json: Record<string, unknown>;
  product_url: string;
  product_name: string;
  commercial_objective: CommercialObjective;
  commercial_objective_note: string;
  category: string;
  target_market: string[];
  target_audience: string;
  style_presets: string[];
  video_lengths: string[];
  aspect_ratios: string[];
  output_quantity: number;
  budget_range: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string;
  selected_studio_id: string | null;
  published_at: string | null;
  /** Legacy brief fields — kept for seed / start flow compat */
  email: string;
  target_platform: string;
  video_format: string;
  video_count: number;
  brand_style: string;
  reference_links: string;
  campaign_goal: string;
  notes: string;
  updated_at: string;
  created_at: string;
};

export type CreateProjectDraftInput = {
  client_email: string;
  client_name: string;
  company_name: string;
  org_id?: string | null;
  created_by?: string | null;
  title?: string;
};

export type CreateProjectInput = {
  client_email: string;
  client_name: string;
  company_name: string;
  email: string;
  product_url: string;
  category: string;
  target_platform: string;
  video_format: string;
  video_count: number;
  budget_range: string;
  deadline: string;
  brand_style: string;
  reference_links: string;
  campaign_goal: string;
  notes: string;
  title?: string;
};

export type UpdateProjectInput = Partial<
  Omit<StoredProject, "id" | "client_email" | "created_at">
>;

export type StoredProjectApplication = {
  id: string;
  project_id: string;
  creator_id: string;
  proposed_amount: number;
  timeline: string;
  proposal: string;
  status: "submitted" | "shortlisted" | "accepted" | "rejected";
  created_at: string;
};

export type ProjectStore = {
  projects: StoredProject[];
  applications: StoredProjectApplication[];
  /** Demo seed IDs the brand explicitly removed — do not re-insert on read. */
  dismissed_demo_ids?: string[];
};

export type MatchReason = {
  en: string;
  zh: string;
};

export type CreatorMatch = {
  creator_id: string;
  score: number;
  reasons: MatchReason[];
  matched_work_ids: string[];
};

export type ProjectMatch = {
  project_id: string;
  score: number;
  reasons: MatchReason[];
};

export type StoredProjectEvent = {
  id: string;
  project_id: string;
  entity_type: "project" | "order" | "proposal" | "contract" | "escrow";
  entity_id: string | null;
  event_name: string;
  from_state: Record<string, unknown> | null;
  to_state: Record<string, unknown> | null;
  actor_id: string | null;
  actor_role: "brand" | "studio" | "admin" | "system";
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ProjectEventStore = {
  events: StoredProjectEvent[];
};
