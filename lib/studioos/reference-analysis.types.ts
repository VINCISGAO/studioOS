import type { ReferenceType } from "@/lib/campaign-types";

export type ReferenceAnalysisStatus = "pending" | "analyzing" | "ready" | "failed" | "unavailable";

export type ReferenceInputKind = "link" | "uploaded_video" | "uploaded_image";

export type ReferenceAccessStatus =
  | "public"
  | "region_restricted"
  | "login_required"
  | "private_or_removed"
  | "unknown";

export type ReferenceShotBreakdownRow = {
  time_range: string;
  shot_description: string;
  framing: string;
  camera_movement: string;
  purpose: string;
};

export type ReferenceVisualLanguage = {
  color: string;
  lighting: string;
  composition: string;
  lens_types: string;
  editing: string;
  typography: string;
};

export type ReferenceAnalysisReport = {
  style_summary: string;
  creative_outline: string[];
  shot_breakdown: ReferenceShotBreakdownRow[];
  visual_language: ReferenceVisualLanguage;
  music_and_rhythm: string;
  copyable_elements: string[];
  non_copyable_elements: string[];
  recommended_creator_types: string[];
  production_difficulty: string;
  copyright_risk_note: string;
  confidence: number;
  source_label: string;
  shot_count: number;
  estimated_duration_seconds: number | null;
};

export type ReferenceAnalysisState = {
  status: ReferenceAnalysisStatus;
  input_kind: ReferenceInputKind;
  access_status: ReferenceAccessStatus;
  platform_label: string;
  report?: ReferenceAnalysisReport;
  analyzed_at?: string;
  analysis_error?: string;
  provider?: "openai" | "template";
};

export type ReferenceAnalysisInput = {
  referenceId: string;
  campaignId: string;
  legacyProjectId: string;
  sourceUrl: string;
  referenceType: ReferenceType;
  inputKind: ReferenceInputKind;
  note?: string;
  brandContext?: string;
  locale?: "zh" | "en";
};
