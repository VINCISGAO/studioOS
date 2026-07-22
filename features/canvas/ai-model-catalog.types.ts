import type { AiModelCategory, GenerationType } from "@prisma/client";

export type PublicAiModelCapabilities = {
  supportedModes: string[];
  supportedAspectRatios: string[];
  supportedDurations: number[];
  supportedResolutions: string[];
  maxOutputCount: number;
  maxReferenceImages: number;
  supportsFirstFrame: boolean;
  supportsLastFrame: boolean;
  supportsAudioInput: boolean;
  supportsPromptEnhancement: boolean;
  supportsSeed: boolean;
  supportsNegativePrompt: boolean;
  supportsInstrumental: boolean;
  supportsVocal: boolean;
  supportsLyrics: boolean;
  supportsStyleTags: boolean;
  minDurationSec: number | null;
  maxDurationSec: number | null;
};

export type PublicAiModelView = {
  recordId: string;
  id: string;
  displayName: string;
  category: AiModelCategory;
  generationType: GenerationType;
  recommended: boolean;
  isDefault: boolean;
  baseCreditPrice: number | null;
  capabilities: PublicAiModelCapabilities;
};

export type PublicAiModelCatalog = {
  models: PublicAiModelView[];
  grouped: Record<AiModelCategory, PublicAiModelView[]>;
  fetchedAt: string;
};

export type ResolvedAiModelForGeneration = {
  recordId: string;
  internalModelId: string;
  displayName: string;
  provider: string;
  generationType: GenerationType;
  capabilities: PublicAiModelCapabilities;
};
