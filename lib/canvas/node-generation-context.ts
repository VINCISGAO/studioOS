import type { GenerationKind } from "@/components/canvas/generation-panel";
import type { CanvasNodeData, VincisCanvasNode } from "@/lib/canvas/types";

export type CanvasGenerationMode =
  | "TEXT_TO_IMAGE"
  | "TEXT_TO_VIDEO"
  | "TEXT_TO_MUSIC"
  | "REGENERATE"
  | "EXTEND"
  | "UPSCALE"
  | "REMOVE_BACKGROUND"
  | "SUBJECT_ISOLATE";

export type NodeGenerationContext = {
  prompt: string;
  model: string;
  parameters: Record<string, string | number | boolean>;
  assetId?: string;
  url?: string;
};

function asParameters(value: unknown): Record<string, string | number | boolean> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const next: Record<string, string | number | boolean> = {};
  for (const [key, item] of Object.entries(record)) {
    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
      next[key] = item;
    }
  }
  return Object.keys(next).length ? next : null;
}

export function defaultParametersForKind(
  kind: GenerationKind
): Record<string, string | number | boolean> {
  if (kind === "image") {
    return { aspectRatio: "1:1", resolution: "1024", outputs: 1, quality: "high" };
  }
  if (kind === "video") {
    return {
      aspectRatio: "auto",
      duration: 5,
      quality: "720p",
      audio: true,
      webSearch: false
    };
  }
  return { duration: 30, instrumental: true };
}

export function readNodeGenerationContext(node: VincisCanvasNode): NodeGenerationContext {
  const kind = node.type === "video" ? "video" : node.type === "music" ? "music" : "image";
  const stored = asParameters(node.data.generationParameters);
  return {
    prompt: node.data.prompt?.trim() ?? "",
    model:
      typeof node.data.generationModel === "string" && node.data.generationModel.trim()
        ? node.data.generationModel
        : "vincis-mock-v1",
    parameters: stored ?? defaultParametersForKind(kind),
    assetId: node.data.assetId,
    url: node.data.url
  };
}

export function patchNodeGenerationMetadata(
  data: CanvasNodeData,
  input: {
    model: string;
    parameters: Record<string, string | number | boolean>;
    mode: CanvasGenerationMode;
  }
): CanvasNodeData {
  return {
    ...data,
    generationModel: input.model,
    generationParameters: input.parameters,
    generationMode: input.mode
  };
}
