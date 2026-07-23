import type { CanvasNodeData, VincisCanvasNode } from "@/lib/canvas/types";
import { computeMusicGenerationCredits } from "@/lib/canvas/generation-credits";
import { MUSIC_NODE_LOADING_CARD } from "@/lib/canvas/music-node-design";
import { readNodeGenerationContext } from "@/lib/canvas/node-generation-context";

const REGENERATE_GAP = 24;

function readMusicMode(parameters: Record<string, string | number | boolean>) {
  const mode = String(parameters.mode ?? "custom").toLowerCase();
  if (mode === "simple") return "simple" as const;
  if (mode === "soundtrack") return "soundtrack" as const;
  return "custom" as const;
}

export function resolveMusicRegeneratePrompt(node: VincisCanvasNode) {
  const ctx = readNodeGenerationContext(node);
  if (ctx.prompt.trim()) return ctx.prompt.trim();
  const style = String(ctx.parameters.style ?? "").trim();
  const songName = String(ctx.parameters.songName ?? "").trim();
  const lyrics = String(ctx.parameters.lyrics ?? "").trim();
  const parts = [songName, style, lyrics].filter(Boolean);
  return parts.join(" · ") || style || "Instrumental music";
}

export function resolveMusicRegenerateCredits(node: VincisCanvasNode) {
  return resolveMusicRegenerateCreditsFromData(node.data, node.data.generationModel);
}

export function resolveMusicRegenerateCreditsFromData(
  data: CanvasNodeData,
  modelId?: string
) {
  const stored = data.chargedCredits;
  if (typeof stored === "number" && Number.isFinite(stored) && stored > 0) {
    return Math.round(stored);
  }
  const parameters = data.generationParameters ?? { instrumental: false };
  return computeMusicGenerationCredits(
    {
      mode: readMusicMode(parameters),
      instrumental: parameters.instrumental === true
    },
    typeof modelId === "string" && modelId.trim() ? modelId : "v7.5-basic"
  );
}

export function canRegenerateMusicNode(data: CanvasNodeData) {
  return data.status === "ready" && Boolean(data.url || data.assetId);
}

export function spawnMusicRegenerateLoadingNode(
  source: VincisCanvasNode,
  prompt: string
): VincisCanvasNode {
  const ctx = readNodeGenerationContext(source);
  const sourceWidth = source.width ?? MUSIC_NODE_LOADING_CARD.width;
  const card = MUSIC_NODE_LOADING_CARD;

  return {
    id: `node_${crypto.randomUUID()}`,
    type: "music",
    position: {
      x: source.position.x + sourceWidth + REGENERATE_GAP,
      y: source.position.y
    },
    width: card.width,
    height: card.height,
    data: {
      title: "音乐生成",
      prompt,
      status: "loading",
      progress: 8,
      generationType: "MUSIC",
      generationModel: ctx.model,
      generationParameters: ctx.parameters,
      generationMode: "REGENERATE"
    }
  };
}
