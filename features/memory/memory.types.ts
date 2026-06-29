import type { AiTonePreference, MemoryOwnerType } from "@prisma/client";

export type BrandDnaSnapshot = {
  version: 1;
  companyName?: string;
  styleReferences: string[];
  visualPreferences: Record<string, string>;
  logoRules: string[];
  ctaRules: string[];
  brandColors: string[];
  musicPreferences: string[];
  subtitleRules: string[];
  voiceoverRules: string[];
  pacingNotes: string[];
  updatedAt: string;
};

export type CreatorDnaSnapshot = {
  version: 1;
  displayName?: string;
  tools: string[];
  formats: string[];
  aiVideoTools: string[];
  subtitleStyle: string[];
  editingSoftware: string[];
  strengths: string[];
  updatedAt: string;
};

export type RelationshipDnaSnapshot = {
  version: 1;
  collaborationCount: number;
  avgSatisfaction: number | null;
  avgReviewRounds: number | null;
  avgDaysEarly: number | null;
  priorityScore: number;
  trustLevel: "new" | "proven" | "preferred" | "strategic";
  highlights: string[];
};

export type CampaignMemorySnapshot = {
  version: 1;
  inheritedFromBrand: boolean;
  brandDna: BrandDnaSnapshot | null;
  resolvedReferences: string[];
  facts: Array<{ category: string; key: string; value: string }>;
};

export type ExtractedMemoryFact = {
  category: string;
  key: string;
  value: string;
  confidence: number;
  ownerType?: MemoryOwnerType;
};

export type MemoryContextBundle = {
  brandDna: BrandDnaSnapshot | null;
  creatorDna: CreatorDnaSnapshot | null;
  relationshipDna: RelationshipDnaSnapshot | null;
  campaignMemory: CampaignMemorySnapshot | null;
  resolvedMessage?: string;
  tone: AiTonePreference;
  neverUseEmojis: boolean;
};
