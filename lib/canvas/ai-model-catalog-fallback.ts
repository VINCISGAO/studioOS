import type { AiModelCategory } from "@prisma/client";
import type {
  PublicAiModelCapabilities,
  PublicAiModelCatalog,
  PublicAiModelView
} from "@/features/canvas/ai-model-catalog.types";

const VIDEO_CAPABILITIES: PublicAiModelCapabilities = {
  supportedModes: ["TEXT_TO_VIDEO", "IMAGE_TO_VIDEO"],
  supportedAspectRatios: ["auto", "16:9", "4:3", "1:1", "3:4", "9:16", "21:9"],
  supportedDurations: [5, 10, 15, 20],
  supportedResolutions: ["480p", "720p", "1080p", "4k"],
  maxOutputCount: 1,
  maxReferenceImages: 4,
  supportsFirstFrame: true,
  supportsLastFrame: true,
  supportsAudioInput: true,
  supportsPromptEnhancement: false,
  supportsSeed: false,
  supportsNegativePrompt: false,
  supportsInstrumental: false,
  supportsVocal: false,
  supportsLyrics: false,
  supportsStyleTags: false,
  minDurationSec: 3,
  maxDurationSec: 20
};

const IMAGE_CAPABILITIES: PublicAiModelCapabilities = {
  supportedModes: ["TEXT_TO_IMAGE", "IMAGE_TO_IMAGE"],
  supportedAspectRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "9:16", "auto"],
  supportedDurations: [],
  supportedResolutions: ["1024", "1536", "2048"],
  maxOutputCount: 4,
  maxReferenceImages: 1,
  supportsFirstFrame: false,
  supportsLastFrame: false,
  supportsAudioInput: false,
  supportsPromptEnhancement: true,
  supportsSeed: false,
  supportsNegativePrompt: true,
  supportsInstrumental: false,
  supportsVocal: false,
  supportsLyrics: false,
  supportsStyleTags: false,
  minDurationSec: null,
  maxDurationSec: null
};

const MUSIC_CAPABILITIES: PublicAiModelCapabilities = {
  supportedModes: ["SIMPLE", "CUSTOM", "SOUNDTRACK"],
  supportedAspectRatios: [],
  supportedDurations: [30, 60, 120],
  supportedResolutions: [],
  maxOutputCount: 1,
  maxReferenceImages: 0,
  supportsFirstFrame: false,
  supportsLastFrame: false,
  supportsAudioInput: false,
  supportsPromptEnhancement: false,
  supportsSeed: false,
  supportsNegativePrompt: false,
  supportsInstrumental: true,
  supportsVocal: true,
  supportsLyrics: true,
  supportsStyleTags: true,
  minDurationSec: 10,
  maxDurationSec: 180
};

function fallbackModel(input: {
  recordId: string;
  id: string;
  displayName: string;
  category: PublicAiModelView["category"];
  generationType: PublicAiModelView["generationType"];
  recommended?: boolean;
  isDefault?: boolean;
  baseCreditPrice: number;
  capabilities: PublicAiModelCapabilities;
}): PublicAiModelView {
  return {
    recordId: input.recordId,
    id: input.id,
    displayName: input.displayName,
    category: input.category,
    generationType: input.generationType,
    recommended: input.recommended ?? false,
    isDefault: input.isDefault ?? false,
    baseCreditPrice: input.baseCreditPrice,
    capabilities: input.capabilities
  };
}

/** Default capabilities when catalog/model view is not ready yet — keeps toolbar usable. */
export function fallbackCapabilitiesForCategory(
  category: AiModelCategory
): PublicAiModelCapabilities {
  if (category === "IMAGE") return IMAGE_CAPABILITIES;
  if (category === "MUSIC") return MUSIC_CAPABILITIES;
  return VIDEO_CAPABILITIES;
}

/** Baked-in catalog when DB is cold or unreachable — keeps Canvas usable. */
export function buildFallbackAiModelCatalog(now = new Date()): PublicAiModelCatalog {
  const models: PublicAiModelView[] = [
    fallbackModel({
      recordId: "aim_seedance2",
      id: "seedance-2.0",
      displayName: "Seedance 2.0",
      category: "VIDEO",
      generationType: "VIDEO",
      recommended: true,
      isDefault: true,
      baseCreditPrice: 69,
      capabilities: VIDEO_CAPABILITIES
    }),
    fallbackModel({
      recordId: "aim_seedance2_fast",
      id: "seedance-2.0-fast",
      displayName: "Seedance 2.0 Fast",
      category: "VIDEO",
      generationType: "VIDEO",
      baseCreditPrice: 58,
      capabilities: {
        ...VIDEO_CAPABILITIES,
        supportedResolutions: ["480p", "720p"]
      }
    }),
    fallbackModel({
      recordId: "aim_seedance2_mini",
      id: "seedance-2.0-mini",
      displayName: "Seedance 2.0 Mini",
      category: "VIDEO",
      generationType: "VIDEO",
      baseCreditPrice: 35,
      capabilities: {
        ...VIDEO_CAPABILITIES,
        supportedResolutions: ["480p", "720p"]
      }
    }),
    fallbackModel({
      recordId: "aim_kling3",
      id: "kling-3.0",
      displayName: "Kling 3.0",
      category: "VIDEO",
      generationType: "VIDEO",
      recommended: true,
      baseCreditPrice: 75,
      capabilities: VIDEO_CAPABILITIES
    }),
    fallbackModel({
      recordId: "aim_kling3_omni",
      id: "kling-3.0-omni",
      displayName: "Kling 3.0 Omni",
      category: "VIDEO",
      generationType: "VIDEO",
      baseCreditPrice: 85,
      capabilities: VIDEO_CAPABILITIES
    }),
    fallbackModel({
      recordId: "aim_veo31",
      id: "veo-3.1",
      displayName: "Veo 3.1",
      category: "VIDEO",
      generationType: "VIDEO",
      recommended: true,
      baseCreditPrice: 180,
      capabilities: VIDEO_CAPABILITIES
    }),
    fallbackModel({
      recordId: "aim_veo31_fast",
      id: "veo-3.1-fast",
      displayName: "Veo 3.1 Fast",
      category: "VIDEO",
      generationType: "VIDEO",
      baseCreditPrice: 140,
      capabilities: VIDEO_CAPABILITIES
    }),
    fallbackModel({
      recordId: "aim_gemini_flash",
      id: "gemini-omni-flash",
      displayName: "Gemini Omni Flash",
      category: "VIDEO",
      generationType: "VIDEO",
      baseCreditPrice: 55,
      capabilities: VIDEO_CAPABILITIES
    }),
    fallbackModel({
      recordId: "aim_gpt_image",
      id: "gpt-image",
      displayName: "GPT Image",
      category: "IMAGE",
      generationType: "IMAGE",
      recommended: true,
      isDefault: true,
      baseCreditPrice: 15,
      capabilities: IMAGE_CAPABILITIES
    }),
    fallbackModel({
      recordId: "aim_gpt_image_mini",
      id: "gpt-image-mini",
      displayName: "GPT Image Mini",
      category: "IMAGE",
      generationType: "IMAGE",
      baseCreditPrice: 10,
      capabilities: IMAGE_CAPABILITIES
    }),
    fallbackModel({
      recordId: "aim_nano_banana2",
      id: "nano-banana-2",
      displayName: "Nano Banana 2",
      category: "IMAGE",
      generationType: "IMAGE",
      recommended: true,
      baseCreditPrice: 15,
      capabilities: IMAGE_CAPABILITIES
    }),
    fallbackModel({
      recordId: "aim_v75_all",
      id: "v7.5-all",
      displayName: "V7.5 All",
      category: "MUSIC",
      generationType: "MUSIC",
      recommended: true,
      isDefault: true,
      baseCreditPrice: 8,
      capabilities: MUSIC_CAPABILITIES
    }),
    fallbackModel({
      recordId: "aim_v75_studio",
      id: "v7.5-studio",
      displayName: "V7.5 Studio",
      category: "MUSIC",
      generationType: "MUSIC",
      baseCreditPrice: 10,
      capabilities: MUSIC_CAPABILITIES
    }),
    fallbackModel({
      recordId: "aim_v75_basic",
      id: "v7.5-basic",
      displayName: "V7.5 Basic",
      category: "MUSIC",
      generationType: "MUSIC",
      baseCreditPrice: 6,
      capabilities: MUSIC_CAPABILITIES
    })
  ];

  return {
    models,
    grouped: {
      VIDEO: models.filter((model) => model.category === "VIDEO"),
      IMAGE: models.filter((model) => model.category === "IMAGE"),
      MUSIC: models.filter((model) => model.category === "MUSIC"),
      VOICE: [],
      THREE_D: []
    },
    fetchedAt: now.toISOString()
  };
}
