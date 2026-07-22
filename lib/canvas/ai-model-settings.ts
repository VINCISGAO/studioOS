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
  const duration = pickClosest(
    settings.duration,
    capabilities.supportedDurations,
    settings.duration
  );
  const mode = settings.mode.toUpperCase();
  const allowedMode = capabilities.supportedModes.find((item) => item === mode);
  const nextMode =
    allowedMode === "SIMPLE"
      ? "simple"
      : allowedMode === "SOUNDTRACK"
        ? "soundtrack"
        : "custom";
  return {
    ...settings,
    duration,
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
  return capabilities.supportedModes
    .map((mode) => {
      if (mode === "SIMPLE") return "simple" as const;
      if (mode === "SOUNDTRACK") return "soundtrack" as const;
      if (mode === "CUSTOM") return "custom" as const;
      return null;
    })
    .filter((mode): mode is "simple" | "custom" | "soundtrack" => mode != null);
}
