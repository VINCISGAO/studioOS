import {
  buildMusicPrompt,
  formatImageAspectRatioLabel,
  hasGenerationReference,
  resolveVideoPricingMode,
  type GenerationKind,
  type GenerationReference,
  type ImageGenerationSettings,
  type MusicGenerationSettings,
  type VideoGenerationSettings,
  type VideoReferenceMode
} from "@/lib/canvas/generation-ui";

export type GenerationSubmitInput = {
  kind: GenerationKind;
  prompt: string;
  model: string;
  parameters: Record<string, string | number | boolean>;
  reference?: GenerationReference | null;
  lastFrameReference?: GenerationReference | null;
};

export function buildGenerationSubmitInput(input: {
  kind: GenerationKind;
  prompt: string;
  reference: GenerationReference | null;
  lastFrameReference?: GenerationReference | null;
  librarySelections?: GenerationReference[];
  videoReferenceMode?: VideoReferenceMode;
  videoSettings: VideoGenerationSettings;
  imageSettings: ImageGenerationSettings;
  musicSettings: MusicGenerationSettings;
  selectedVideoModel: string;
  selectedImageModel: string;
  selectedMusicModel: string;
}): GenerationSubmitInput {
  const hasPrimaryReference = hasGenerationReference(input.reference);
  const hasLastFrameReference = hasGenerationReference(input.lastFrameReference);
  const libraryAssetIds = [
    ...new Set(
      (input.librarySelections ?? [])
        .map((item) => item.assetId?.trim())
        .filter((id): id is string => Boolean(id))
    )
  ];

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
    lastFrameReference: input.lastFrameReference ?? null,
    parameters:
      input.kind === "video"
        ? {
            aspectRatio: input.videoSettings.aspectRatio,
            duration: input.videoSettings.duration,
            quality: input.videoSettings.quality,
            audio: input.videoSettings.audio,
            webSearch: input.videoSettings.webSearch,
            cameraMovements: input.videoSettings.cameraMovements.join(","),
            videoReferenceMode: input.videoReferenceMode ?? "reference",
            mode: resolveVideoPricingMode({
              videoReferenceMode: input.videoReferenceMode ?? "reference",
              hasPrimaryReference: hasPrimaryReference || hasLastFrameReference
            }),
            ...(input.reference?.mimeType ? { referenceMimeType: input.reference.mimeType } : {}),
            ...(input.lastFrameReference?.assetId
              ? { lastFrameReferenceAssetId: input.lastFrameReference.assetId }
              : {}),
            ...(input.lastFrameReference?.url
              ? { lastFrameReferenceUrl: input.lastFrameReference.url }
              : {}),
            ...(input.lastFrameReference?.nodeId
              ? { lastFrameReferenceNodeId: input.lastFrameReference.nodeId }
              : {}),
            ...(input.lastFrameReference?.mimeType
              ? { lastFrameReferenceMimeType: input.lastFrameReference.mimeType }
              : {}),
            ...(libraryAssetIds.length
              ? { libraryReferenceAssetIds: libraryAssetIds.join(",") }
              : {})
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
