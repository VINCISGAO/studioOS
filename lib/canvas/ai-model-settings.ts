import type { PublicAiModelCapabilities, PublicAiModelView } from "@/features/canvas/ai-model-catalog.types";
import type {
  ImageGenerationSettings,
  MusicGenerationSettings,
  VideoGenerationSettings
} from "@/lib/canvas/generation-ui";

function pickClosest(value: number, allowed: number[], fallback: number) {
  if (!allowed.length) return value;
  if (allowed.includes(value)) return value;
  return allowed.reduce((best, current) =>
    Math.abs(current - value) < Math.abs(best - value) ? current : best
  , allowed[0] ?? fallback);
}

function pickString(value: string, allowed: string[], fallback: string) {
  if (!allowed.length) return value;
  return allowed.includes(value) ? value : allowed.includes(fallback) ? fallback : allowed[0] ?? value;
}

export function defaultModelForCategory(
  models: PublicAiModelView[],
  category: PublicAiModelView["category"]
) {
  const scoped = models.filter((model) => model.category === category);
  return scoped.find((model) => model.isDefault) ?? scoped[0] ?? null;
}

export function clampVideoSettings(
  settings: VideoGenerationSettings,
  capabilities: PublicAiModelCapabilities
): VideoGenerationSettings {
  const duration = pickClosest(
    settings.duration,
    capabilities.supportedDurations,
    settings.duration
  );
  return {
    ...settings,
    aspectRatio: pickString(
      settings.aspectRatio,
      capabilities.supportedAspectRatios,
      "auto"
    ) as VideoGenerationSettings["aspectRatio"],
    duration,
    quality: pickString(
      settings.quality,
      capabilities.supportedResolutions,
      settings.quality
    ) as VideoGenerationSettings["quality"],
    audio: capabilities.supportsAudioInput ? settings.audio : false
  };
}

export function clampImageSettings(
  settings: ImageGenerationSettings,
  capabilities: PublicAiModelCapabilities
): ImageGenerationSettings {
  const outputs = Math.min(settings.outputs, Math.max(1, capabilities.maxOutputCount));
  return {
    ...settings,
    outputs,
    aspectRatio: pickString(
      settings.aspectRatio,
      capabilities.supportedAspectRatios,
      "auto"
    ) as ImageGenerationSettings["aspectRatio"]
  };
}

export function clampMusicSettings(
  settings: MusicGenerationSettings,
  capabilities: PublicAiModelCapabilities
): MusicGenerationSettings {
  const mode = settings.mode === "soundtrack" ? "custom" : settings.mode;
  const upperMode = mode.toUpperCase();
  const allowedMode = capabilities.supportedModes.find((item) => item === upperMode);
  const nextMode =
    allowedMode === "SIMPLE" || (mode === "simple" && capabilities.supportedModes.includes("SIMPLE"))
      ? "simple"
      : "custom";
  return {
    ...settings,
    mode: nextMode,
    instrumental: capabilities.supportsInstrumental ? settings.instrumental : true
  };
}

export function videoReferenceModesForCapabilities(capabilities: PublicAiModelCapabilities) {
  const modes: Array<"reference" | "edit" | "keyframes"> = ["reference"];
  if (capabilities.supportedModes.includes("IMAGE_TO_VIDEO")) {
    modes.push("edit");
  }
  if (capabilities.supportsFirstFrame || capabilities.supportsLastFrame) {
    modes.push("keyframes");
  }
  return modes;
}

export function musicModesForCapabilities(capabilities: PublicAiModelCapabilities) {
  const modes: Array<"simple" | "custom"> = [];
  if (capabilities.supportedModes.includes("SIMPLE")) {
    modes.push("simple");
  }
  if (
    capabilities.supportedModes.includes("CUSTOM") ||
    capabilities.supportedModes.includes("SOUNDTRACK")
  ) {
    modes.push("custom");
  }
  return modes.length > 0 ? modes : (["simple", "custom"] as const);
}
