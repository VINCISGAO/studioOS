import { musicFieldLimitsExceeded } from "@/lib/canvas/music-field-limits";

export type GenerationKind = "image" | "video" | "music";

export type CanvasModelId = string;

export type VideoReferenceMode = "reference" | "edit" | "keyframes";

export const GENERATION_PANEL_WIDTH = 548;
export { MUSIC_PANEL_WIDTH as GENERATION_MUSIC_PANEL_WIDTH } from "@/lib/canvas/music-panel-design";
export const GENERATION_PANEL_HEIGHT = 268;
/** Music custom panel is taller than video/image — used for slot anchoring. */
export const GENERATION_MUSIC_PANEL_HEIGHT = 520;
/** Generation panel sits below canvas nodes; body-portaled modals must render above it. */
export const CANVAS_GENERATION_PANEL_Z_INDEX = 100;
/** Above portal shell (z-0), canvas chrome, and generation panel popovers (z-120). */
export const CANVAS_GENERATION_MODAL_Z_INDEX = 300;

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

export type ImageModelId = CanvasModelId;

export type ImageGenerationSettings = {
  quality: ImageQualityTier;
  aspectRatio: ImageAspectRatioId;
  width: number;
  height: number;
  lockAspect: boolean;
  outputs: number;
};

export function truncateModelDisplayLabel(label: string, maxLength = 14) {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, Math.max(1, maxLength - 1))}…`;
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

export type VideoModelId = CanvasModelId;

export type VideoGenerationSettings = {
  aspectRatio: VideoAspectRatio;
  duration: number;
  quality: VideoQuality;
  audio: boolean;
  webSearch: boolean;
  cameraMovements: CameraMovementId[];
};

export type CameraMovementOption = {
  id: CameraMovementId;
  label: { zh: string; en: string };
};

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

export type MusicCreationMode = "simple" | "custom" | "soundtrack";
export type MusicModelVersion = CanvasModelId;
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
};

export const MUSIC_STYLE_TAGS = {
  zh: ["梦幻流行", "电吉他", "中速", "精力充沛", "未来主义", "氛围感", "钢琴", "电子"],
  en: ["Dream pop", "Electric guitar", "Mid tempo", "Energetic", "Futuristic", "Ambient", "Piano", "Electronic"]
} as const;

export const DEFAULT_MUSIC_SETTINGS: MusicGenerationSettings = {
  mode: "custom",
  modelVersion: "",
  lyrics: "",
  style: "",
  instrumental: false,
  vocalGender: "female",
  songName: "",
  referenceEnabled: false,
  remixEnabled: false,
  vocalEnabled: false
};

export function formatMusicSettingsLabel(settings: MusicGenerationSettings, locale: "zh" | "en") {
  const modeLabel =
    settings.mode === "simple"
      ? locale === "zh"
        ? "简单"
        : "Simple"
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
  return `${modeLabel} · ${vocalLabel}`;
}

export function buildMusicPrompt(settings: MusicGenerationSettings) {
  const parts = [settings.songName.trim(), settings.style.trim()].filter(Boolean);
  if (!settings.instrumental && settings.lyrics.trim()) {
    parts.push(settings.lyrics.trim());
  }
  return parts.join(" · ") || settings.style.trim() || "Instrumental music";
}

export function canSubmitMusicSettings(settings: MusicGenerationSettings) {
  if (musicFieldLimitsExceeded(settings)) return false;
  return buildMusicPrompt(settings).trim().length >= 3;
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
