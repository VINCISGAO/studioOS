import {
  computeImageGenerationCredits,
  computeMusicGenerationCredits,
  computeVideoGenerationCredits
} from "@/lib/canvas/generation-credits";

export type GenerationKind = "image" | "video" | "music";

export type VideoReferenceMode = "reference" | "edit" | "keyframes";

export const GENERATION_PANEL_WIDTH = 520;
export const GENERATION_MUSIC_PANEL_WIDTH = 620;
export const GENERATION_PANEL_HEIGHT = 300;

export type GenerationReference = {
  url: string;
  assetId?: string;
  fileName: string;
  mimeType?: string;
  source: "local" | "library" | "canvas";
  nodeId?: string;
  reviewStatus?: "PENDING" | "APPROVED" | "REJECTED";
  reviewReasons?: string[];
  selectable?: boolean;
};

export type ImageQualityTier = "auto" | "high" | "medium" | "low";

export type ImageAspectRatioId =
  | "1:1"
  | "3:2"
  | "2:3"
  | "4:3"
  | "3:4"
  | "9:16"
  | "1:1_2k"
  | "16:9_2k"
  | "9:16_2k"
  | "16:9_4k"
  | "9:16_4k"
  | "auto";

export type ImageModelId = "gpt-image" | "gpt-image-mini";

export type ImageGenerationSettings = {
  quality: ImageQualityTier;
  aspectRatio: ImageAspectRatioId;
  width: number;
  height: number;
  lockAspect: boolean;
  outputs: number;
};

export type ImageModelOption = {
  id: ImageModelId;
  label: string;
};

export const IMAGE_MODELS: ImageModelOption[] = [
  { id: "gpt-image", label: "GPT Image" },
  { id: "gpt-image-mini", label: "GPT Image Mini" }
];

export function getImageModelLabel(modelId: ImageModelId) {
  return IMAGE_MODELS.find((model) => model.id === modelId)?.label ?? modelId;
}

export function getImageModelDisplayLabel(modelId: ImageModelId) {
  if (modelId === "gpt-image") return "GPT Im...";
  return getImageModelLabel(modelId);
}

export const IMAGE_ASPECT_RATIOS: ImageAspectRatioId[] = [
  "1:1",
  "3:2",
  "2:3",
  "4:3",
  "3:4",
  "9:16",
  "1:1_2k",
  "16:9_2k",
  "9:16_2k",
  "16:9_4k",
  "9:16_4k",
  "auto"
];

export const IMAGE_QUALITY_TIERS: ImageQualityTier[] = ["auto", "high", "medium", "low"];

export const DEFAULT_IMAGE_MODEL: ImageModelId = "gpt-image";

export const DEFAULT_IMAGE_SETTINGS: ImageGenerationSettings = {
  quality: "medium",
  aspectRatio: "auto",
  width: 1024,
  height: 1024,
  lockAspect: true,
  outputs: 1
};

const IMAGE_RATIO_DIMENSIONS: Record<ImageAspectRatioId, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "3:2": { width: 1536, height: 1024 },
  "2:3": { width: 1024, height: 1536 },
  "4:3": { width: 1365, height: 1024 },
  "3:4": { width: 1024, height: 1365 },
  "9:16": { width: 1024, height: 1820 },
  "1:1_2k": { width: 2048, height: 2048 },
  "16:9_2k": { width: 2560, height: 1440 },
  "9:16_2k": { width: 1440, height: 2560 },
  "16:9_4k": { width: 3840, height: 2160 },
  "9:16_4k": { width: 2160, height: 3840 },
  auto: { width: 1024, height: 1024 }
};

export function formatImageAspectRatioLabel(ratio: ImageAspectRatioId) {
  if (ratio === "auto") return "auto";
  if (ratio === "1:1_2k") return "1:1(2k)";
  if (ratio === "16:9_2k") return "16:9(2k)";
  if (ratio === "9:16_2k") return "9:16(2k)";
  if (ratio === "16:9_4k") return "16:9(4k)";
  if (ratio === "9:16_4k") return "9:16(4k)";
  return ratio;
}

export function formatImageQualityLabel(quality: ImageQualityTier, locale: "zh" | "en") {
  if (locale === "zh") {
    if (quality === "auto") return "自动";
    if (quality === "high") return "高";
    if (quality === "medium") return "中";
    return "低";
  }
  if (quality === "auto") return "Auto";
  if (quality === "high") return "High";
  if (quality === "medium") return "Medium";
  return "Low";
}

export function formatImageSettingsLabel(settings: ImageGenerationSettings, locale: "zh" | "en") {
  const quality = formatImageQualityLabel(settings.quality, locale);
  const ratio = formatImageAspectRatioLabel(settings.aspectRatio);
  const count = locale === "zh" ? `${settings.outputs} 张` : `${settings.outputs}`;
  return `${quality} · ${ratio} · ${count}`;
}

export function applyImageAspectRatio(settings: ImageGenerationSettings, ratio: ImageAspectRatioId) {
  const dimensions = IMAGE_RATIO_DIMENSIONS[ratio];
  return {
    ...settings,
    aspectRatio: ratio,
    width: dimensions.width,
    height: dimensions.height
  };
}

export function estimateImageCredits(settings: ImageGenerationSettings) {
  return computeImageGenerationCredits({
    quality: settings.quality,
    width: settings.width,
    height: settings.height,
    outputs: settings.outputs
  });
}

export type VideoAspectRatio = "auto" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16" | "21:9";
export type VideoQuality = "480p" | "720p" | "1080p" | "4k";

export type CameraMovementId =
  | "orbit_subject"
  | "static"
  | "handheld"
  | "zoom_out"
  | "push_in"
  | "follow"
  | "pan_right"
  | "pan_left"
  | "tilt_up"
  | "tilt_down"
  | "orbit_shot";

export type VideoModelId =
  | "seedance-2.0"
  | "seedance-2.0-fast"
  | "seedance-2.0-mini"
  | "kling-3.0"
  | "kling-3.0-omni"
  | "veo-3.1"
  | "veo-3.1-fast"
  | "gemini-omni-flash";

export type VideoGenerationSettings = {
  aspectRatio: VideoAspectRatio;
  duration: number;
  quality: VideoQuality;
  audio: boolean;
  webSearch: boolean;
  cameraMovements: CameraMovementId[];
};

export type VideoModelOption = {
  id: VideoModelId;
  label: string;
  provider: "seedance" | "kling" | "veo" | "gemini";
  memberOnly: boolean;
};

export type CameraMovementOption = {
  id: CameraMovementId;
  label: { zh: string; en: string };
};

export const VIDEO_MODELS: VideoModelOption[] = [
  { id: "seedance-2.0", label: "Seedance 2.0", provider: "seedance", memberOnly: true },
  { id: "seedance-2.0-fast", label: "Seedance 2.0 Fast", provider: "seedance", memberOnly: true },
  { id: "seedance-2.0-mini", label: "Seedance 2.0 Mini", provider: "seedance", memberOnly: true },
  { id: "kling-3.0", label: "Kling 3.0", provider: "kling", memberOnly: true },
  { id: "kling-3.0-omni", label: "Kling 3.0 Omni", provider: "kling", memberOnly: true },
  { id: "veo-3.1", label: "Veo 3.1", provider: "veo", memberOnly: true },
  { id: "veo-3.1-fast", label: "Veo 3.1 Fast", provider: "veo", memberOnly: true },
  { id: "gemini-omni-flash", label: "Gemini Omni Flash", provider: "gemini", memberOnly: true }
];

export const CAMERA_MOVEMENTS: CameraMovementOption[] = [
  { id: "orbit_subject", label: { zh: "环绕主体运镜", en: "Orbit subject" } },
  { id: "static", label: { zh: "固定镜头", en: "Static shot" } },
  { id: "handheld", label: { zh: "手持镜头", en: "Handheld" } },
  { id: "zoom_out", label: { zh: "拉远缩放", en: "Zoom out" } },
  { id: "push_in", label: { zh: "推进", en: "Push in" } },
  { id: "follow", label: { zh: "跟随拍摄", en: "Follow shot" } },
  { id: "pan_right", label: { zh: "向右摇摄", en: "Pan right" } },
  { id: "pan_left", label: { zh: "向左摇摄", en: "Pan left" } },
  { id: "tilt_up", label: { zh: "向上摇摄", en: "Tilt up" } },
  { id: "tilt_down", label: { zh: "向下摇摄", en: "Tilt down" } },
  { id: "orbit_shot", label: { zh: "环绕拍摄", en: "Orbit shot" } }
];

export const DEFAULT_VIDEO_MODEL: VideoModelId = "seedance-2.0";

export const VIDEO_ASPECT_RATIOS: VideoAspectRatio[] = [
  "auto",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
  "21:9"
];

export const VIDEO_QUALITIES: VideoQuality[] = ["480p", "720p", "1080p", "4k"];

export const DEFAULT_VIDEO_SETTINGS: VideoGenerationSettings = {
  aspectRatio: "auto",
  duration: 5,
  quality: "720p",
  audio: true,
  webSearch: false,
  cameraMovements: []
};

export function formatVideoSettingsLabel(settings: VideoGenerationSettings, locale: "zh" | "en") {
  void locale;
  const ratio = settings.aspectRatio === "auto" ? "Auto" : settings.aspectRatio;
  return `${ratio} · ${settings.duration}s · ${settings.quality}`;
}

export function getVideoModelLabel(modelId: VideoModelId) {
  return VIDEO_MODELS.find((model) => model.id === modelId)?.label ?? modelId;
}

export function getVideoModelDisplayLabel(modelId: VideoModelId) {
  if (modelId === "seedance-2.0") return "Seedance 2.0";
  const label = getVideoModelLabel(modelId);
  return label.length > 14 ? `${label.slice(0, 12)}…` : label;
}

export function estimateVideoCredits(
  settings: VideoGenerationSettings,
  modelId: VideoModelId = DEFAULT_VIDEO_MODEL
) {
  return computeVideoGenerationCredits(
    {
      aspectRatio: settings.aspectRatio,
      duration: settings.duration,
      quality: settings.quality,
      audio: settings.audio,
      webSearch: settings.webSearch,
      cameraMovements: settings.cameraMovements
    },
    modelId
  );
}

export type MusicCreationMode = "simple" | "custom" | "soundtrack";
export type MusicModelVersion = "v7.5-all" | "v7.5-studio" | "v7.5-basic";
export type VocalGender = "female" | "male";

export type MusicGenerationSettings = {
  mode: MusicCreationMode;
  modelVersion: MusicModelVersion;
  lyrics: string;
  style: string;
  instrumental: boolean;
  vocalGender: VocalGender;
  songName: string;
  referenceEnabled: boolean;
  remixEnabled: boolean;
  vocalEnabled: boolean;
  duration: number;
};

export type MusicModelOption = {
  id: MusicModelVersion;
  label: { zh: string; en: string };
};

export const MUSIC_MODELS: MusicModelOption[] = [
  { id: "v7.5-all", label: { zh: "V7.5-全部", en: "V7.5 All" } },
  { id: "v7.5-studio", label: { zh: "V7.5-Studio", en: "V7.5 Studio" } },
  { id: "v7.5-basic", label: { zh: "V7.5-Basic", en: "V7.5 Basic" } }
];

export const MUSIC_STYLE_TAGS = {
  zh: ["梦幻流行", "电吉他", "中速", "精力充沛", "未来主义", "氛围感", "钢琴", "电子"],
  en: ["Dream pop", "Electric guitar", "Mid tempo", "Energetic", "Futuristic", "Ambient", "Piano", "Electronic"]
} as const;

export const DEFAULT_MUSIC_SETTINGS: MusicGenerationSettings = {
  mode: "custom",
  modelVersion: "v7.5-all",
  lyrics: "",
  style: "",
  instrumental: true,
  vocalGender: "female",
  songName: "",
  referenceEnabled: false,
  remixEnabled: false,
  vocalEnabled: false,
  duration: 30
};

export function getMusicModelLabel(modelId: MusicModelVersion, locale: "zh" | "en") {
  return MUSIC_MODELS.find((model) => model.id === modelId)?.label[locale] ?? modelId;
}

export function getMusicModelDisplayLabel(modelId: MusicModelVersion, locale: "zh" | "en") {
  const label = getMusicModelLabel(modelId, locale);
  return label.length > 10 ? `${label.slice(0, 8)}...` : label;
}

export function formatMusicSettingsLabel(settings: MusicGenerationSettings, locale: "zh" | "en") {
  const modeLabel =
    settings.mode === "simple"
      ? locale === "zh"
        ? "简单"
        : "Simple"
      : settings.mode === "soundtrack"
        ? locale === "zh"
          ? "原声带"
          : "Soundtrack"
        : locale === "zh"
          ? "自定义"
          : "Custom";
  const vocalLabel = settings.instrumental
    ? locale === "zh"
      ? "器乐"
      : "Instrumental"
    : locale === "zh"
      ? "人声"
      : "Vocal";
  return `${modeLabel} · ${settings.duration}s · ${vocalLabel}`;
}

export function buildMusicPrompt(settings: MusicGenerationSettings) {
  const parts = [settings.songName.trim(), settings.style.trim()].filter(Boolean);
  if (!settings.instrumental && settings.lyrics.trim()) {
    parts.push(settings.lyrics.trim());
  }
  return parts.join(" · ") || settings.style.trim() || "Instrumental music";
}

export function canSubmitMusicSettings(settings: MusicGenerationSettings) {
  return (
    settings.style.trim().length >= 2 ||
    settings.songName.trim().length >= 1 ||
    (!settings.instrumental && settings.lyrics.trim().length >= 2)
  );
}

export function estimateMusicCredits(settings: MusicGenerationSettings) {
  return computeMusicGenerationCredits({
    mode: settings.mode,
    instrumental: settings.instrumental,
    duration: settings.duration
  });
}

export type CanvasLibraryAsset = {
  id: string;
  fileName: string;
  mimeType: string;
  url: string;
  assetType: string;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
  reviewReasons: string[];
  selectable: boolean;
};
