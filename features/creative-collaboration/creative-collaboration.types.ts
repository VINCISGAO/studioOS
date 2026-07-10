export type CollaborationActor = "brand" | "creator";

export type CollaborationIdeaStatus =
  | "draft"
  | "sent"
  | "acknowledged"
  | "confirmed"
  | "rejected";

export type CollaborationIdea = {
  id: string;
  title: string;
  summary: string;
  coreIdea: string;
  hook: string;
  story: string;
  visualStyle: string;
  tone: string;
  shotList: string[];
  cta: string;
  rationale: string;
  actor: CollaborationActor;
  parentId?: string;
  createdAt: string;
  status: CollaborationIdeaStatus;
};

export type FinalCreativeDirection = {
  ideaId: string;
  title: string;
  summary: string;
  confirmedBy: CollaborationActor;
  confirmedAt: string;
  fullText: string;
};

export type CreativeCollaborationState = {
  ideas: CollaborationIdea[];
  brandSentIdeaId?: string;
  creatorSentIdeaIds?: string[];
  brandSkippedAt?: string;
  brandGenerationCount: number;
  creatorDerivativeCount: number;
  finalCreativeDirection?: FinalCreativeDirection;
};

export type CreativeCollaborationView = CreativeCollaborationState & {
  hasConfirmedDirection: boolean;
  brandIdeas: CollaborationIdea[];
  creatorIdeas: CollaborationIdea[];
  brandSentIdea?: CollaborationIdea;
  pendingCreatorIdeas: CollaborationIdea[];
};

export const CREATIVE_COLLABORATION_SETTINGS_KEY = "creative_collaboration";

export const COLLABORATION_DISCLAIMER = {
  zh: "以下创意仅供参考，最终创作方向由品牌方与 Creator 共同确认。",
  en: "These ideas are reference drafts only. Final creative direction must be confirmed by Brand and Creator together."
} as const;

export const COLLABORATION_GENERATING_COPY = {
  zh: "AI 正在为你生成 3 个最佳创意方向",
  en: "AI is generating 3 creative directions for you"
} as const;

export const CREATIVE_DIRECTION_WARNING = {
  zh: "请先确认创意方向，再开始制作。",
  en: "Confirm the creative direction before starting production."
} as const;

export const CREATIVE_DIRECTION_RISK = {
  zh: "未确认创意方向，存在返工风险。",
  en: "Creative direction is not confirmed — rework risk applies."
} as const;
