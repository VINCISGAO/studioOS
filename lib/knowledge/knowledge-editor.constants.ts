export const KNOWLEDGE_EDITOR_MAX_WIDTH = "max-w-[1600px]";

export const KNOWLEDGE_EDITOR_CATEGORIES = [
  { slug: "ai-advertising", name: "AI Advertising" },
  { slug: "ai-video", name: "AI Video" },
  { slug: "brand-marketing", name: "Brand Marketing" },
  { slug: "creative-strategy", name: "Creative Strategy" },
  { slug: "industry-trends", name: "Industry Trends" },
  { slug: "case-study", name: "Case Study" },
  { slug: "tutorial", name: "Tutorial" },
  { slug: "company-news", name: "Company News" }
] as const;

export const KNOWLEDGE_TAG_SUGGESTIONS = [
  "AI Advertising",
  "Artificial Intelligence",
  "Marketing",
  "Video Ads",
  "Brand",
  "Creative",
  "TikTok",
  "Performance",
  "Lucien",
  "SEO"
] as const;

export const KNOWLEDGE_PUBLISH_STATUSES = ["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED"] as const;

export const KNOWLEDGE_VISIBILITY_OPTIONS = ["PUBLIC", "PRIVATE", "INTERNAL"] as const;

export const KNOWLEDGE_COVER_MAX_BYTES = 4 * 1024 * 1024;

export const KNOWLEDGE_SLUG_MAX_LENGTH = 120;
