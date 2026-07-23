import type { GenerationKind } from "@/lib/canvas/generation-ui";
import { GENERATION_IMAGE_PANEL_WIDTH } from "@/lib/canvas/generation-panel-design";
import { MUSIC_PANEL_WIDTH } from "@/lib/canvas/music-panel-design";
import { GENERATION_VIDEO_PANEL_WIDTH } from "@/lib/canvas/generation-video-panel-design";
import { GENERATION_MUSIC_PANEL_HEIGHT } from "@/lib/canvas/generation-ui";

/** Approximate rendered height for viewport centering — video/image/music panels differ. */
export const GENERATION_VIDEO_PANEL_HEIGHT = 396;
export const GENERATION_IMAGE_PANEL_HEIGHT = 332;

export function generationPanelDimensions(kind: GenerationKind) {
  if (kind === "music") {
    return {
      width: MUSIC_PANEL_WIDTH,
      height: GENERATION_MUSIC_PANEL_HEIGHT
    };
  }
  if (kind === "image") {
    return {
      width: GENERATION_IMAGE_PANEL_WIDTH,
      height: GENERATION_IMAGE_PANEL_HEIGHT
    };
  }
  return {
    width: GENERATION_VIDEO_PANEL_WIDTH,
    height: GENERATION_VIDEO_PANEL_HEIGHT
  };
}
