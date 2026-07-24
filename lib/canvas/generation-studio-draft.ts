import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import {
  DEFAULT_IMAGE_SETTINGS,
  DEFAULT_MUSIC_SETTINGS,
  DEFAULT_VIDEO_SETTINGS,
  type GenerationKind,
  type GenerationReference,
  type ImageGenerationSettings,
  type MusicGenerationSettings,
  type VideoGenerationSettings,
  type VideoReferenceMode
} from "@/lib/canvas/generation-ui";

export const GENERATION_STUDIO_DRAFT_VERSION = 1;

export type GenerationStudioDraft = {
  version: typeof GENERATION_STUDIO_DRAFT_VERSION;
  kind: GenerationKind;
  prompt: string;
  referenceSlot: GenerationReferenceSlot;
  videoSettings: VideoGenerationSettings;
  imageSettings: ImageGenerationSettings;
  musicSettings: MusicGenerationSettings;
  selectedVideoModel: string;
  selectedImageModel: string;
  selectedMusicModel: string;
  videoReferenceMode: VideoReferenceMode;
  reference: GenerationReference | null;
  lastFrameReference: GenerationReference | null;
  librarySelections: GenerationReference[];
};

function storageKey(projectId: string) {
  return `vincis:canvas:generation-draft:${projectId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseReference(value: unknown): GenerationReference | null {
  if (!isRecord(value)) return null;
  const url = typeof value.url === "string" ? value.url.trim() : "";
  const fileName = typeof value.fileName === "string" ? value.fileName.trim() : "";
  const source = value.source;
  if (!url && typeof value.assetId !== "string") return null;
  if (source !== "local" && source !== "library" && source !== "canvas") return null;
  return {
    url,
    assetId: typeof value.assetId === "string" ? value.assetId : undefined,
    fileName: fileName || "reference",
    mimeType: typeof value.mimeType === "string" ? value.mimeType : undefined,
    source,
    nodeId: typeof value.nodeId === "string" ? value.nodeId : undefined,
    reviewStatus:
      value.reviewStatus === "PENDING" ||
      value.reviewStatus === "APPROVED" ||
      value.reviewStatus === "REJECTED"
        ? value.reviewStatus
        : undefined,
    reviewReasons: Array.isArray(value.reviewReasons)
      ? value.reviewReasons.filter((item): item is string => typeof item === "string")
      : undefined,
    selectable: typeof value.selectable === "boolean" ? value.selectable : undefined
  };
}

function parseReferenceList(value: unknown): GenerationReference[] {
  if (!Array.isArray(value)) return [];
  return value.map(parseReference).filter((item): item is GenerationReference => item !== null);
}

function parseKind(value: unknown, fallback: GenerationKind): GenerationKind {
  return value === "video" || value === "image" || value === "music" ? value : fallback;
}

function parseReferenceSlot(value: unknown, fallback: GenerationReferenceSlot): GenerationReferenceSlot {
  return value === "video" || value === "image" || value === "audio" ? value : fallback;
}

function parseVideoReferenceMode(value: unknown): VideoReferenceMode {
  return value === "edit" || value === "keyframes" ? value : "reference";
}

function parseVideoSettings(value: unknown): VideoGenerationSettings {
  if (!isRecord(value)) return DEFAULT_VIDEO_SETTINGS;
  return {
    aspectRatio:
      value.aspectRatio === "auto" ||
      value.aspectRatio === "16:9" ||
      value.aspectRatio === "4:3" ||
      value.aspectRatio === "1:1" ||
      value.aspectRatio === "3:4" ||
      value.aspectRatio === "9:16" ||
      value.aspectRatio === "21:9"
        ? value.aspectRatio
        : DEFAULT_VIDEO_SETTINGS.aspectRatio,
    duration:
      typeof value.duration === "number" && Number.isFinite(value.duration)
        ? value.duration
        : DEFAULT_VIDEO_SETTINGS.duration,
    quality:
      value.quality === "480p" ||
      value.quality === "720p" ||
      value.quality === "1080p" ||
      value.quality === "4k"
        ? value.quality
        : DEFAULT_VIDEO_SETTINGS.quality,
    audio: typeof value.audio === "boolean" ? value.audio : DEFAULT_VIDEO_SETTINGS.audio,
    webSearch:
      typeof value.webSearch === "boolean" ? value.webSearch : DEFAULT_VIDEO_SETTINGS.webSearch,
    cameraMovements: Array.isArray(value.cameraMovements)
      ? value.cameraMovements.filter((item): item is VideoGenerationSettings["cameraMovements"][number] =>
          typeof item === "string"
        )
      : DEFAULT_VIDEO_SETTINGS.cameraMovements
  };
}

function parseImageSettings(value: unknown): ImageGenerationSettings {
  if (!isRecord(value)) return DEFAULT_IMAGE_SETTINGS;
  return {
    quality:
      value.quality === "auto" ||
      value.quality === "high" ||
      value.quality === "medium" ||
      value.quality === "low"
        ? value.quality
        : DEFAULT_IMAGE_SETTINGS.quality,
    aspectRatio:
      typeof value.aspectRatio === "string"
        ? (value.aspectRatio as ImageGenerationSettings["aspectRatio"])
        : DEFAULT_IMAGE_SETTINGS.aspectRatio,
    width:
      typeof value.width === "number" && Number.isFinite(value.width)
        ? value.width
        : DEFAULT_IMAGE_SETTINGS.width,
    height:
      typeof value.height === "number" && Number.isFinite(value.height)
        ? value.height
        : DEFAULT_IMAGE_SETTINGS.height,
    lockAspect:
      typeof value.lockAspect === "boolean" ? value.lockAspect : DEFAULT_IMAGE_SETTINGS.lockAspect,
    outputs:
      typeof value.outputs === "number" && Number.isFinite(value.outputs)
        ? value.outputs
        : DEFAULT_IMAGE_SETTINGS.outputs
  };
}

function parseMusicSettings(value: unknown): MusicGenerationSettings {
  if (!isRecord(value)) return DEFAULT_MUSIC_SETTINGS;
  return {
    mode:
      value.mode === "simple" || value.mode === "custom" || value.mode === "soundtrack"
        ? value.mode
        : DEFAULT_MUSIC_SETTINGS.mode,
    modelVersion:
      typeof value.modelVersion === "string" ? value.modelVersion : DEFAULT_MUSIC_SETTINGS.modelVersion,
    lyrics: typeof value.lyrics === "string" ? value.lyrics : DEFAULT_MUSIC_SETTINGS.lyrics,
    style: typeof value.style === "string" ? value.style : DEFAULT_MUSIC_SETTINGS.style,
    instrumental:
      typeof value.instrumental === "boolean"
        ? value.instrumental
        : DEFAULT_MUSIC_SETTINGS.instrumental,
    vocalGender:
      value.vocalGender === "male" || value.vocalGender === "female"
        ? value.vocalGender
        : DEFAULT_MUSIC_SETTINGS.vocalGender,
    songName: typeof value.songName === "string" ? value.songName : DEFAULT_MUSIC_SETTINGS.songName,
    referenceEnabled:
      typeof value.referenceEnabled === "boolean"
        ? value.referenceEnabled
        : DEFAULT_MUSIC_SETTINGS.referenceEnabled,
    remixEnabled:
      typeof value.remixEnabled === "boolean" ? value.remixEnabled : DEFAULT_MUSIC_SETTINGS.remixEnabled,
    vocalEnabled:
      typeof value.vocalEnabled === "boolean" ? value.vocalEnabled : DEFAULT_MUSIC_SETTINGS.vocalEnabled
  };
}

export function readGenerationStudioDraft(
  projectId: string,
  fallbackKind: GenerationKind = "video"
): GenerationStudioDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(projectId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== GENERATION_STUDIO_DRAFT_VERSION) return null;
    return {
      version: GENERATION_STUDIO_DRAFT_VERSION,
      kind: parseKind(parsed.kind, fallbackKind),
      prompt: typeof parsed.prompt === "string" ? parsed.prompt : "",
      referenceSlot: parseReferenceSlot(parsed.referenceSlot, "video"),
      videoSettings: parseVideoSettings(parsed.videoSettings),
      imageSettings: parseImageSettings(parsed.imageSettings),
      musicSettings: parseMusicSettings(parsed.musicSettings),
      selectedVideoModel:
        typeof parsed.selectedVideoModel === "string" ? parsed.selectedVideoModel : "",
      selectedImageModel:
        typeof parsed.selectedImageModel === "string" ? parsed.selectedImageModel : "",
      selectedMusicModel:
        typeof parsed.selectedMusicModel === "string" ? parsed.selectedMusicModel : "",
      videoReferenceMode: parseVideoReferenceMode(parsed.videoReferenceMode),
      reference: parseReference(parsed.reference),
      lastFrameReference: parseReference(parsed.lastFrameReference),
      librarySelections: parseReferenceList(parsed.librarySelections)
    };
  } catch {
    return null;
  }
}

export function writeGenerationStudioDraft(projectId: string, draft: GenerationStudioDraft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey(projectId), JSON.stringify(draft));
  } catch {
    // ignore quota / private mode
  }
}

export function clearGenerationStudioDraft(projectId: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(storageKey(projectId));
  } catch {
    // ignore
  }
}
