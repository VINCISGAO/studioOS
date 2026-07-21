"use client";

import { useEffect, useState } from "react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import { GenerationImageReferenceSlot } from "@/components/canvas/generation-image-reference-slot";
import {
  GenerationKindSelector,
  type GenerationReferenceSlot
} from "@/components/canvas/generation-kind-selector";
import { GenerationMusicSettingsPanel } from "@/components/canvas/generation-music-settings-panel";
import { GenerationStudioReferenceHost } from "@/components/canvas/generation-studio-reference-host";
import { GenerationStudioToolbar } from "@/components/canvas/generation-studio-toolbar";
import { GenerationVideoHeader } from "@/components/canvas/generation-video-header";
import { useGenerationStudioReferences } from "@/components/canvas/hooks/use-generation-studio-references";
import {
  DEFAULT_IMAGE_MODEL,
  DEFAULT_IMAGE_SETTINGS,
  DEFAULT_MUSIC_SETTINGS,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_VIDEO_SETTINGS,
  canSubmitMusicSettings,
  estimateImageCredits,
  estimateMusicCredits,
  estimateVideoCredits,
  formatImageSettingsLabel,
  formatMusicSettingsLabel,
  formatVideoSettingsLabel,
  type GenerationKind,
  type ImageGenerationSettings,
  type ImageModelId,
  type MusicGenerationSettings,
  type MusicModelVersion,
  type VideoGenerationSettings,
  type VideoModelId,
  type VideoReferenceMode
} from "@/lib/canvas/generation-ui";
import {
  buildGenerationSubmitInput,
  type GenerationSubmitInput
} from "@/lib/canvas/generation-submit";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: { placeholder: "今天我们要创作什么" },
  en: { placeholder: "What are we creating today?" }
} as const;

export function GenerationStudioPanel({
  kind: initialKind,
  locale,
  projectId,
  busy,
  anchor,
  anchorPlacement = "above",
  onClose,
  onSubmit
}: {
  kind: GenerationKind;
  locale: Locale;
  projectId: string;
  busy: boolean;
  anchor: { x: number; y: number };
  anchorPlacement?: "above" | "below";
  onClose: () => void;
  onSubmit: (input: GenerationSubmitInput) => void;
}) {
  const t = copy[locale];
  const nodes = useCanvasStore((state) => state.nodes);
  const references = useGenerationStudioReferences(projectId);
  const [kind, setKind] = useState<GenerationKind>(initialKind);
  const [referenceSlot, setReferenceSlot] = useState<GenerationReferenceSlot>(
    initialKind === "music" ? "audio" : "video"
  );
  const [prompt, setPrompt] = useState("");
  const [videoSettings, setVideoSettings] = useState<VideoGenerationSettings>(DEFAULT_VIDEO_SETTINGS);
  const [imageSettings, setImageSettings] = useState<ImageGenerationSettings>(DEFAULT_IMAGE_SETTINGS);
  const [selectedVideoModel, setSelectedVideoModel] = useState<VideoModelId>(DEFAULT_VIDEO_MODEL);
  const [selectedImageModel, setSelectedImageModel] = useState<ImageModelId>(DEFAULT_IMAGE_MODEL);
  const [musicSettings, setMusicSettings] = useState<MusicGenerationSettings>(DEFAULT_MUSIC_SETTINGS);
  const [selectedMusicModel, setSelectedMusicModel] = useState<MusicModelVersion>(
    DEFAULT_MUSIC_SETTINGS.modelVersion
  );
  const [videoReferenceMode, setVideoReferenceMode] = useState<VideoReferenceMode>("reference");
  const [showUploadMenu, setShowUploadMenu] = useState(false);

  const credits =
    kind === "video"
      ? estimateVideoCredits(videoSettings, selectedVideoModel)
      : kind === "image"
        ? estimateImageCredits(imageSettings)
        : estimateMusicCredits(musicSettings);
  const settingsLabel =
    kind === "video"
      ? formatVideoSettingsLabel(videoSettings, locale)
      : kind === "image"
        ? formatImageSettingsLabel(imageSettings, locale)
        : formatMusicSettingsLabel(musicSettings, locale);
  const submitDisabled =
    busy || (kind === "music" ? !canSubmitMusicSettings(musicSettings) : prompt.trim().length < 3);

  useEffect(() => {
    setKind(initialKind);
    if (initialKind === "video") setReferenceSlot("video");
    if (initialKind === "music") setReferenceSlot("audio");
  }, [initialKind]);

  function submit() {
    if (submitDisabled) return;
    onSubmit(
      buildGenerationSubmitInput({
        kind,
        prompt,
        reference: references.reference,
        videoSettings,
        imageSettings,
        musicSettings,
        selectedVideoModel,
        selectedImageModel,
        selectedMusicModel
      })
    );
  }

  return (
    <>
      <div
        className="pointer-events-none absolute z-40 w-max max-w-[calc(100vw-24px)]"
        style={{
          left: anchor.x,
          top: anchor.y,
          transform: anchorPlacement === "below" ? "translate(-50%, 0)" : "translate(-50%, -100%)"
        }}
      >
        <div
          className={cn(
            "pointer-events-auto max-w-[calc(100vw-24px)] rounded-[24px] border border-zinc-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]",
            kind === "music" ? "w-[620px]" : "w-[520px]"
          )}
        >
          {kind === "video" ? (
            <>
              <GenerationVideoHeader
                locale={locale}
                uploadOpen={showUploadMenu}
                onUploadToggle={() => setShowUploadMenu((value) => !value)}
                onLocalUpload={() => {
                  setShowUploadMenu(false);
                  references.pickLocalReference(referenceSlot);
                }}
                onOpenLibrary={() => {
                  setShowUploadMenu(false);
                  references.openReferenceLibrary(referenceSlot);
                }}
                onOpenCanvasPicker={() => {
                  setShowUploadMenu(false);
                  references.openReferenceCanvasPicker(referenceSlot);
                }}
              />
              <div className="px-4 pt-3">
                <GenerationKindSelector
                  selectedSlot={referenceSlot}
                  locale={locale}
                  onSelectVideo={() => {
                    setReferenceSlot("video");
                    setKind("video");
                  }}
                  onSelectImage={() => {
                    setReferenceSlot("image");
                    setKind("video");
                  }}
                  onSelectAudio={() => {
                    setReferenceSlot("audio");
                    setKind("music");
                  }}
                  onReferenceLocal={references.pickLocalReference}
                  onReferenceLibrary={references.openReferenceLibrary}
                  onReferenceCanvas={references.openReferenceCanvasPicker}
                />
              </div>
            </>
          ) : null}

          <div
            className={cn(
              kind === "music" ? "px-4 pb-4 pt-4" : kind === "image" ? "px-3 pb-1 pt-3" : "px-4 pb-2 pt-3"
            )}
          >
            {kind === "image" ? (
              <div className="flex items-start gap-2.5">
                <GenerationImageReferenceSlot
                  locale={locale}
                  reference={references.reference}
                  onLocalUpload={() => references.pickLocalReference("image")}
                  onCanvasPick={() => references.setShowCanvasPicker(true)}
                  onClear={() => references.setReference(null)}
                />
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={2}
                  maxLength={4000}
                  placeholder={t.placeholder}
                  className="min-h-[56px] flex-1 resize-none bg-transparent text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400"
                />
              </div>
            ) : kind === "music" ? (
              <GenerationMusicSettingsPanel
                locale={locale}
                settings={musicSettings}
                settingsLabel={settingsLabel}
                generating={busy}
                submitDisabled={submitDisabled}
                credits={credits}
                onChange={(next) => {
                  setMusicSettings(next);
                  setSelectedMusicModel(next.modelVersion);
                }}
                onClose={onClose}
                onSubmit={submit}
              />
            ) : (
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={2}
                maxLength={4000}
                placeholder={t.placeholder}
                className="min-h-[72px] w-full resize-none bg-transparent text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            )}
          </div>

          {kind !== "music" ? (
            <GenerationStudioToolbar
              locale={locale}
              kind={kind}
              generating={busy}
              submitDisabled={submitDisabled}
              credits={credits}
              settingsLabel={settingsLabel}
              videoSettings={videoSettings}
              imageSettings={imageSettings}
              musicSettings={musicSettings}
              selectedVideoModel={selectedVideoModel}
              selectedImageModel={selectedImageModel}
              selectedMusicModel={selectedMusicModel}
              onVideoModelChange={setSelectedVideoModel}
              onImageModelChange={setSelectedImageModel}
              onMusicModelChange={(modelId) => {
                setSelectedMusicModel(modelId);
                setMusicSettings((current) => ({ ...current, modelVersion: modelId }));
              }}
              onVideoSettingsChange={setVideoSettings}
              onImageSettingsChange={setImageSettings}
              videoReferenceMode={videoReferenceMode}
              onVideoReferenceModeChange={setVideoReferenceMode}
              onClose={onClose}
              onSubmit={submit}
            />
          ) : null}
        </div>
      </div>

      <GenerationStudioReferenceHost
        locale={locale}
        projectId={projectId}
        nodes={nodes}
        reference={references.reference}
        showAssetLibrary={references.showAssetLibrary}
        showCanvasPicker={references.showCanvasPicker}
        canvasPickerSlot={references.canvasPickerSlot}
        uploadingReference={references.uploadingReference}
        localInputRef={references.localInputRef}
        onReferenceChange={references.setReference}
        onCloseAssetLibrary={() => references.setShowAssetLibrary(false)}
        onCloseCanvasPicker={() => references.setShowCanvasPicker(false)}
        onLocalFileSelected={references.handleLocalFile}
        onUploadReference={references.uploadLibraryAsset}
      />
    </>
  );
}
