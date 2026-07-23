import type { CanvasNodeData } from "@/lib/canvas/types";
import { formatAudioTime } from "@/lib/canvas/music-node-design";

export type VideoNodeMetadata = {
  prompt: string;
  modelLabel: string;
  aspectRatioLabel: string;
  durationLabel: string;
  qualityLabel: string;
};

function readParameters(data: CanvasNodeData) {
  const raw = data.generationParameters;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, string | number | boolean>;
}

function resolveModelLabel(modelId?: string) {
  if (!modelId?.trim()) return "Seedance 2.0";
  const normalized = modelId.trim().toLowerCase();
  if (normalized.includes("seedance")) return "Seedance 2.0";
  return modelId.trim();
}

function resolveAspectRatioLabel(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "Auto";
  return value === "auto" ? "Auto" : value;
}

function resolveDurationLabel(value: unknown) {
  const seconds = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return "5s";
  return `${Math.round(seconds)}s`;
}

function resolveQualityLabel(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  return "720p";
}

export function readVideoNodeMetadata(data: CanvasNodeData): VideoNodeMetadata {
  const params = readParameters(data);
  return {
    prompt: data.prompt?.trim() ?? "",
    modelLabel: resolveModelLabel(
      typeof data.generationModel === "string" ? data.generationModel : undefined
    ),
    aspectRatioLabel: resolveAspectRatioLabel(params.aspectRatio),
    durationLabel: resolveDurationLabel(params.duration),
    qualityLabel: resolveQualityLabel(params.quality)
  };
}

export function formatVideoDuration(seconds: number) {
  return formatAudioTime(seconds);
}
