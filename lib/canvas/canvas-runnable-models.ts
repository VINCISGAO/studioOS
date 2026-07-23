import type { AiModel } from "@prisma/client";
import { isMurekaMusicProvider } from "@/lib/canvas/mureka-client";
import { isSeedanceVideoModel, isSeedanceVideoProvider } from "@/lib/canvas/seedance-client";

/** True when this DB row maps to a provider we can actually run today. */
export function isRunnableCanvasAiModel(
  row: Pick<AiModel, "category" | "internalModelId" | "provider">,
  infra: { seedance: boolean; mureka: boolean; openai: boolean }
) {
  if (row.category === "VIDEO") {
    return (
      infra.seedance &&
      (isSeedanceVideoModel(row.internalModelId) || isSeedanceVideoProvider(row.provider))
    );
  }
  if (row.category === "MUSIC") {
    return infra.mureka && isMurekaMusicProvider(row.provider);
  }
  if (row.category === "IMAGE") {
    return infra.openai && row.provider.trim().toLowerCase() === "openai";
  }
  return false;
}

/** Fallback catalog ids that have real provider wiring (no Kling/Veo placeholders). */
export function isRunnableFallbackModelId(modelId: string, category: AiModel["category"]) {
  if (category === "VIDEO") {
    return isSeedanceVideoModel(modelId);
  }
  if (category === "MUSIC") {
    const normalized = modelId.trim().toLowerCase();
    return normalized.startsWith("v7.5-") || normalized.startsWith("mureka-");
  }
  if (category === "IMAGE") {
    const normalized = modelId.trim().toLowerCase();
    return normalized.includes("gpt-image") || normalized.includes("nano-banana");
  }
  return false;
}
