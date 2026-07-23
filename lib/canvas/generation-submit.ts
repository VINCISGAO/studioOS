import {
  buildMusicPrompt,
  formatImageAspectRatioLabel,
  type GenerationKind,
  type GenerationReference,
  type ImageGenerationSettings,
  type MusicGenerationSettings,
  type VideoGenerationSettings
} from "@/lib/canvas/generation-ui";

export type GenerationSubmitInput = {
  kind: GenerationKind;
  prompt: string;
  model: string;
  parameters: Record<string, string | number | boolean>;
  reference?: GenerationReference | null;
};

export function buildGenerationSubmitInput(input: {
  kind: GenerationKind;
  prompt: string;
  reference: GenerationReference | null;
  videoSettings: VideoGenerationSettings;
  imageSettings: ImageGenerationSettings;
  musicSettings: MusicGenerationSettings;
  selectedVideoModel: string;
  selectedImageModel: string;
  selectedMusicModel: string;
}): GenerationSubmitInput {
  return {
    kind: input.kind,
    prompt: input.kind === "music" ? buildMusicPrompt(input.musicSettings) : input.prompt.trim(),
    model:
      input.kind === "video"
        ? input.selectedVideoModel
        : input.kind === "image"
          ? input.selectedImageModel
          : input.selectedMusicModel,
    reference: input.reference,
    parameters:
      input.kind === "video"
        ? {
            aspectRatio: input.videoSettings.aspectRatio,
            duration: input.videoSettings.duration,
            quality: input.videoSettings.quality,
            audio: input.videoSettings.audio,
            webSearch: input.videoSettings.webSearch,
            cameraMovements: input.videoSettings.cameraMovements.join(",")
          }
        : input.kind === "image"
          ? {
              aspectRatio: formatImageAspectRatioLabel(input.imageSettings.aspectRatio),
              quality: input.imageSettings.quality,
              width: input.imageSettings.width,
              height: input.imageSettings.height,
              resolution: String(Math.max(input.imageSettings.width, input.imageSettings.height)),
              outputs: input.imageSettings.outputs
            }
          : {
              style: input.musicSettings.style,
              mood: input.musicSettings.style,
              instrumental: input.musicSettings.instrumental,
              lyrics: input.musicSettings.lyrics,
              songName: input.musicSettings.songName,
              mode: input.musicSettings.mode,
              vocalGender: input.musicSettings.vocalGender,
              referenceEnabled: input.musicSettings.referenceEnabled,
              remixEnabled: input.musicSettings.remixEnabled,
              vocalEnabled: input.musicSettings.vocalEnabled
            }
  };
}
