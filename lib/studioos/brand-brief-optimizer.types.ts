export type BriefOptimizerGap = {
  id: string;
  message: string;
  suggestion: string;
};

export type BriefOptimizerSellingPoint = {
  priority: number;
  label: string;
};

export type BrandBriefOptimizerResult = {
  campaign_name: string;
  primary_objective: string;
  secondary_objectives: string[];
  recommended_kpis: string[];
  audience_primary: string;
  audience_segments: string[];
  audience_confidence: number;
  consumer_insight: string;
  key_message: string;
  selling_points: BriefOptimizerSellingPoint[];
  recommended_platforms: string[];
  recommended_video_duration: string;
  recommended_creator_types: string[];
  recommended_tones: string[];
  recommended_cta: string;
  visual_style: string[];
  gaps: BriefOptimizerGap[];
  brief_document: string;
};
