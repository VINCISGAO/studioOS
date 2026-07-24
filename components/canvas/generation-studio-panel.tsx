"use client";

import { useEffect, useState } from "react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import {
  GenerationCatalogEmptyBanner,
  GenerationCatalogErrorBanner,
  GenerationCatalogLoadingBanner,
  GenerationModelUnavailableBanner,
  GenerationPricingUnavailableBanner
} from "@/components/canvas/generation-catalog-status";
import { GenerationVideoStudioSection } from "@/components/canvas/generation-video-studio-section";
import { GenerationVideoStudioToolbar } from "@/components/canvas/generation-video-studio-toolbar";
import { GenerationImageStudioSection } from "@/components/canvas/generation-image-studio-section";
import { GenerationMusicSettingsPanel } from "@/components/canvas/generation-music-settings-panel";
import { type GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import { useCanvasAiModels } from "@/components/canvas/hooks/use-canvas-ai-models";
import type { PublicAiModelCatalog } from "@/features/canvas/ai-model-catalog.types";
import { useGenerationStudioReferences } from "@/components/canvas/hooks/use-generation-studio-references";
import { useGenerationCreditQuote } from "@/components/canvas/hooks/use-generation-credit-quote";
import {
  clampImageSettings,
  clampMusicSettings,
  clampVideoSettings,
  videoReferenceModesForCapabilities
} from "@/lib/canvas/ai-model-settings";
import { GenerationStudioReferenceHost } from "@/components/canvas/generation-studio-reference-host";
import { GenerationStudioToolbar } from "@/components/canvas/generation-studio-toolbar";
import {
  GENERATION_IMAGE_PANEL_WIDTH,
  GENERATION_PANEL_FOOTER_CLASS,
  GENERATION_PANEL_SHELL_CLASS
} from "@/lib/canvas/generation-panel-design";
import { MUSIC_PANEL_SHELL_CLASS } from "@/lib/canvas/music-panel-design";
import { GENERATION_VIDEO_PANEL_WIDTH, VIDEO_PANEL_FOOTER_CLASS } from "@/lib/canvas/generation-video-panel-design";
import {
  DEFAULT_IMAGE_SETTINGS,
  DEFAULT_MUSIC_SETTINGS,
  DEFAULT_VIDEO_SETTINGS,
  GENERATION_MUSIC_PANEL_WIDTH,
  canSubmitMusicSettings,
  formatImageSettingsLabel,
  formatMusicSettingsLabel,
  formatVideoSettingsLabel,
  isImageGenerationReference,
  type GenerationKind,
  type ImageGenerationSettings,
  type MusicGenerationSettings,
  type VideoGenerationSettings,
  type VideoReferenceMode,
  CANVAS_GENERATION_PANEL_Z_INDEX
} from "@/lib/canvas/generation-ui";
import {
  buildGenerationSubmitInput,
  type GenerationSubmitInput
} from "@/lib/canvas/generation-submit";
import { normalizeCanvasTokenBalance, computeGenerationCredits } from "@/lib/canvas/generation-credits";
import { CanvasInsufficientCreditsBanner } from "@/components/canvas/canvas-insufficient-credits-banner";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function panelWidth(kind: GenerationKind) {
  if (kind === "music") return GENERATION_MUSIC_PANEL_WIDTH;
  if (kind === "image") return GENERATION_IMAGE_PANEL_WIDTH;
  return GENERATION_VIDEO_PANEL_WIDTH;
}

export function GenerationStudioPanel({
  kind: initialKind,
  locale,
  projectId,
  busy,
  anchor,
  anchorPlacement = "center",
  tokenBalance,
  initialAiModelCatalog,
  onSwitchKind,
  onClose,
  onSubmit
}: {
  kind: GenerationKind;
  locale: Locale;
  projectId: string;
  busy: boolean;
  anchor: { x: number; y: number };
  anchorPlacement?: "above" | "below" | "center";
  tokenBalance: number;
  initialAiModelCatalog?: PublicAiModelCatalog | null;
  onSwitchKind?: (kind: GenerationKind) => void;
  onClose: () => void;
  onSubmit: (input: GenerationSubmitInput) => void;
}) {
  const nodes = useCanvasStore((state) => state.nodes);
  const references = useGenerationStudioReferences(projectId);
  const catalog = useCanvasAiModels(initialAiModelCatalog);
  const [kind, setKind] = useState<GenerationKind>(initialKind);
  const [referenceSlot, setReferenceSlot] = useState<GenerationReferenceSlot>(
    initialKind === "music" ? "audio" : "video"
  );
  const [prompt, setPrompt] = useState("");
  const [videoSettings, setVideoSettings] = useState<VideoGenerationSettings>(DEFAULT_VIDEO_SETTINGS);
  const [imageSettings, setImageSettings] = useState<ImageGenerationSettings>(DEFAULT_IMAGE_SETTINGS);
  const [selectedVideoModel, setSelectedVideoModel] = useState("");
  const [selectedImageModel, setSelectedImageModel] = useState("");
  const [musicSettings, setMusicSettings] = useState<MusicGenerationSettings>(DEFAULT_MUSIC_SETTINGS);
  const [selectedMusicModel, setSelectedMusicModel] = useState("");
  const [videoReferenceMode, setVideoReferenceMode] = useState<VideoReferenceMode>("reference");
  const [showUploadMenu, setShowUploadMenu] = useState(false);

  useEffect(() => {
    if (!catalog.catalog || catalog.loading) return;
    const videoDefault = catalog.defaultModelForKind("video");
    const imageDefault = catalog.defaultModelForKind("image");
    const musicDefault = catalog.defaultModelForKind("music");
    if (videoDefault && !catalog.findModelForKind("video", selectedVideoModel)) {
      setSelectedVideoModel(videoDefault.id);
    }
    if (imageDefault && !catalog.findModelForKind("image", selectedImageModel)) {
      setSelectedImageModel(imageDefault.id);
    }
    if (musicDefault && !catalog.findModelForKind("music", selectedMusicModel)) {
      setSelectedMusicModel(musicDefault.id);
      setMusicSettings((current) => ({ ...current, modelVersion: musicDefault.id }));
    }
  }, [catalog.catalog, catalog.loading, selectedVideoModel, selectedImageModel, selectedMusicModel]);

  const selectedVideoModelView = catalog.findModelForKind("video", selectedVideoModel);
  const selectedImageModelView = catalog.findModelForKind("image", selectedImageModel);
  const selectedMusicModelView = catalog.findModelForKind("music", selectedMusicModel);

  useEffect(() => {
    if (!selectedVideoModelView) return;
    setVideoSettings((current) => clampVideoSettings(current, selectedVideoModelView.capabilities));
    const allowedModes = videoReferenceModesForCapabilities(selectedVideoModelView.capabilities);
    setVideoReferenceMode((current) => (allowedModes.includes(current) ? current : allowedModes[0] ?? "reference"));
  }, [selectedVideoModelView?.id]);

  useEffect(() => {
    if (videoReferenceMode === "edit" || videoReferenceMode === "keyframes") {
      setReferenceSlot("image");
    }
    if (videoReferenceMode !== "keyframes") {
      references.setLastFrameReference(null);
    }
  }, [videoReferenceMode]);

  useEffect(() => {
    if (!selectedImageModelView) return;
    setImageSettings((current) => clampImageSettings(current, selectedImageModelView.capabilities));
  }, [selectedImageModelView?.id]);

  useEffect(() => {
    if (!selectedMusicModelView) return;
    setMusicSettings((current) => clampMusicSettings(current, selectedMusicModelView.capabilities));
  }, [selectedMusicModelView?.id]);

  const submitPreview = buildGenerationSubmitInput({
    kind,
    prompt,
    reference: references.reference,
    lastFrameReference: references.lastFrameReference,
    librarySelections: references.librarySelections,
    videoReferenceMode,
    videoSettings,
    imageSettings,
    musicSettings,
    selectedVideoModel,
    selectedImageModel,
    selectedMusicModel
  });

  const quoteParameters: Record<string, string | number | boolean> = {
    ...submitPreview.parameters
  };
  if (submitPreview.reference?.assetId) quoteParameters.referenceAssetId = submitPreview.reference.assetId;
  if (typeof submitPreview.parameters.libraryReferenceAssetIds === "string") {
    quoteParameters.libraryReferenceAssetIds = submitPreview.parameters.libraryReferenceAssetIds;
  }
  if (submitPreview.reference?.url) quoteParameters.referenceUrl = submitPreview.reference.url;
  if (submitPreview.reference?.nodeId) quoteParameters.referenceNodeId = submitPreview.reference.nodeId;
  if (submitPreview.reference?.mimeType) {
    quoteParameters.referenceMimeType = submitPreview.reference.mimeType;
  }
  if (submitPreview.lastFrameReference?.assetId) {
    quoteParameters.lastFrameReferenceAssetId = submitPreview.lastFrameReference.assetId;
  }
  if (submitPreview.lastFrameReference?.url) {
    quoteParameters.lastFrameReferenceUrl = submitPreview.lastFrameReference.url;
  }
  if (submitPreview.lastFrameReference?.nodeId) {
    quoteParameters.lastFrameReferenceNodeId = submitPreview.lastFrameReference.nodeId;
  }
  if (submitPreview.lastFrameReference?.mimeType) {
    quoteParameters.lastFrameReferenceMimeType = submitPreview.lastFrameReference.mimeType;
  }
  if (kind === "video") {
    quoteParameters.videoReferenceMode = videoReferenceMode;
  }

  const quoteEnabled =
    !catalog.loading &&
    !catalog.error &&
    Boolean(submitPreview.model) &&
    Boolean(
      kind === "video"
        ? selectedVideoModelView
        : kind === "image"
          ? selectedImageModelView
          : selectedMusicModelView
    );

  const quote = useGenerationCreditQuote({
    kind,
    model: submitPreview.model,
    parameters: quoteParameters,
    enabled: quoteEnabled
  });

  const localCreditEstimate =
    quoteEnabled && submitPreview.model
      ? computeGenerationCredits({
          type: kind === "video" ? "VIDEO" : kind === "image" ? "IMAGE" : "MUSIC",
          model: submitPreview.model,
          parameters: quoteParameters
        })
      : 0;

  const credits =
    quote.credits > 0 ? quote.credits : localCreditEstimate > 0 ? localCreditEstimate : quote.credits;
  const settingsLabel =
    kind === "video"
      ? formatVideoSettingsLabel(videoSettings, locale)
      : kind === "image"
        ? formatImageSettingsLabel(imageSettings, locale)
        : formatMusicSettingsLabel(musicSettings, locale);

  const modelsForKind = catalog.modelsForKind(kind);
  const selectedModelView =
    kind === "video"
      ? selectedVideoModelView
      : kind === "image"
        ? selectedImageModelView
        : selectedMusicModelView;
  const catalogEmpty = !catalog.loading && !catalog.error && modelsForKind.length === 0;
  const modelUnavailable =
    quoteEnabled && Boolean(submitPreview.model) && !selectedModelView;
  const pricingUnavailable =
    quoteEnabled && !quote.loading && Boolean(quote.error) && localCreditEstimate <= 0;
  const insufficientCredits = credits > 0 ? tokenBalance < credits : false;
  const promptTooShort = kind !== "music" && prompt.trim().length < 3;
  const videoReferenceInvalid =
    kind === "video" &&
    (videoReferenceMode === "edit"
      ? !isImageGenerationReference(references.reference)
      : videoReferenceMode === "keyframes"
        ? !isImageGenerationReference(references.reference) ||
          !isImageGenerationReference(references.lastFrameReference)
        : false);
  const allowedVideoReferenceModes = selectedVideoModelView
    ? videoReferenceModesForCapabilities(selectedVideoModelView.capabilities)
    : (["reference"] as VideoReferenceMode[]);
  const submitDisabled =
    busy ||
    catalog.loading ||
    Boolean(catalog.error) ||
    catalogEmpty ||
    modelUnavailable ||
    pricingUnavailable ||
    credits <= 0 ||
    insufficientCredits ||
    !submitPreview.model ||
    videoReferenceInvalid ||
    (kind === "music" ? !canSubmitMusicSettings(musicSettings) : promptTooShort);

  useEffect(() => {
    setKind(initialKind);
    if (initialKind === "video") setReferenceSlot("video");
    if (initialKind === "music") setReferenceSlot("audio");
  }, [initialKind]);

  function submit() {
    if (submitDisabled) return;
    onSubmit(submitPreview);
  }

  function stopCanvasPointer(event: React.PointerEvent | React.MouseEvent) {
    event.stopPropagation();
  }

  const width = panelWidth(kind);
  const referenceOverlayOpen = references.showAssetLibrary || references.showCanvasPicker;
  const panelTransform =
    anchorPlacement === "center"
      ? "translate(-50%, -50%)"
      : anchorPlacement === "below"
        ? "translate(-50%, 0)"
        : "translate(-50%, -100%)";

  return (
    <>
      <div
        className={cn(
          "absolute max-w-[calc(100vw-24px)] nodrag nopan pointer-events-auto transition-[left,top,opacity] duration-200 ease-out will-change-[left,top]",
          referenceOverlayOpen && "pointer-events-none opacity-40"
        )}
        style={{
          left: anchor.x,
          top: anchor.y,
          width,
          zIndex: referenceOverlayOpen ? 1 : CANVAS_GENERATION_PANEL_Z_INDEX,
          transform: panelTransform
        }}
        onPointerDown={referenceOverlayOpen ? undefined : stopCanvasPointer}
        onPointerDownCapture={referenceOverlayOpen ? undefined : stopCanvasPointer}
        onMouseDown={referenceOverlayOpen ? undefined : stopCanvasPointer}
        aria-hidden={referenceOverlayOpen}
      >
        <div className={kind === "music" ? MUSIC_PANEL_SHELL_CLASS : GENERATION_PANEL_SHELL_CLASS}>
          {kind === "video" ? (
            <GenerationVideoStudioSection
              locale={locale}
              projectId={projectId}
              prompt={prompt}
              catalogError={catalog.error}
              catalogEmpty={catalogEmpty}
              modelUnavailable={modelUnavailable}
              pricingUnavailable={pricingUnavailable}
              pricingError={quote.error}
              referenceSlot={referenceSlot}
              videoReferenceMode={videoReferenceMode}
              firstFrameReference={references.reference}
              lastFrameReference={references.lastFrameReference}
              librarySelections={references.librarySelections}
              activeReferenceId={
                references.reference?.assetId ?? references.reference?.url ?? undefined
              }
              uploadOpen={showUploadMenu}
              onPromptChange={setPrompt}
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
              onSelectVideo={() => {
                setReferenceSlot("video");
                setKind("video");
              }}
              onSelectImage={() => {
                setReferenceSlot("image");
              }}
              onSelectAudio={() => {
                setReferenceSlot("audio");
              }}
              onReferenceLocal={(slot) => {
                setShowUploadMenu(false);
                references.pickLocalReference(slot);
              }}
              onReferenceLibrary={(slot) => {
                setShowUploadMenu(false);
                references.openReferenceLibrary(slot);
              }}
              onReferenceCanvas={(slot) => {
                setShowUploadMenu(false);
                references.openReferenceCanvasPicker(slot);
              }}
              onActivateLibrarySelection={references.activateLibrarySelection}
              onRemoveLibrarySelection={references.removeLibrarySelection}
              onPickFirstFrameLocal={() => {
                setShowUploadMenu(false);
                references.pickLocalReference("image", "primary");
              }}
              onPickFirstFrameCanvas={() => {
                setShowUploadMenu(false);
                references.openReferenceCanvasPicker("image", "primary");
              }}
              onPickFirstFrameLibrary={() => {
                setShowUploadMenu(false);
                references.openReferenceLibrary("image", "primary");
              }}
              onPickLastFrameLocal={() => {
                setShowUploadMenu(false);
                references.pickLocalReference("image", "lastFrame");
              }}
              onPickLastFrameCanvas={() => {
                setShowUploadMenu(false);
                references.openReferenceCanvasPicker("image", "lastFrame");
              }}
              onPickLastFrameLibrary={() => {
                setShowUploadMenu(false);
                references.openReferenceLibrary("image", "lastFrame");
              }}
              onClearFirstFrame={() => references.setReference(null)}
              onClearLastFrame={() => references.setLastFrameReference(null)}
              onCatalogRetry={() => void catalog.reload()}
              videoModels={catalog.modelsForKind("video")}
              selectedVideoModel={selectedVideoModel}
              selectedVideoModelView={selectedVideoModelView}
              onVideoModelChange={setSelectedVideoModel}
            />
          ) : null}

          {kind === "image" ? (
            <GenerationImageStudioSection
              locale={locale}
              prompt={prompt}
              reference={references.reference}
              catalogLoading={catalog.loading}
              catalogError={catalog.error}
              catalogEmpty={catalogEmpty}
              modelUnavailable={modelUnavailable}
              pricingUnavailable={pricingUnavailable}
              pricingError={quote.error}
              insufficientCredits={insufficientCredits}
              tokenBalance={tokenBalance}
              credits={credits}
              onPromptChange={setPrompt}
              onLocalUpload={() => references.pickLocalReference("image")}
              onOpenLibrary={() => references.openReferenceLibrary("image")}
              onCanvasPick={() => references.openReferenceCanvasPicker("image")}
              onClearReference={() => references.setReference(null)}
              onCatalogRetry={() => void catalog.reload()}
            />
          ) : null}

          <div className={cn(kind === "music" ? "px-4 pb-4 pt-3" : "hidden")}>
            {kind === "music" ? (
              <>
                {catalog.loading ? <GenerationCatalogLoadingBanner locale={locale} /> : null}
                {catalog.error ? (
                  <div className="pb-2">
                    <GenerationCatalogErrorBanner
                      locale={locale}
                      message={catalog.error}
                      onRetry={() => void catalog.reload()}
                    />
                  </div>
                ) : null}
                {catalogEmpty ? (
                  <div className="pb-2">
                    <GenerationCatalogEmptyBanner locale={locale} kind="music" />
                  </div>
                ) : null}
                {modelUnavailable ? (
                  <div className="pb-2">
                    <GenerationModelUnavailableBanner locale={locale} />
                  </div>
                ) : null}
                {pricingUnavailable ? (
                  <div className="pb-2">
                    <GenerationPricingUnavailableBanner locale={locale} message={quote.error} />
                  </div>
                ) : null}
                {insufficientCredits ? (
                  <div className="mb-3">
                    <CanvasInsufficientCreditsBanner
                      locale={locale}
                      tokenBalance={tokenBalance}
                      credits={credits}
                    />
                  </div>
                ) : null}
                {!catalog.loading && !catalog.error ? (
                  <GenerationMusicSettingsPanel
                    locale={locale}
                    projectId={projectId}
                    settings={musicSettings}
                    settingsLabel={settingsLabel}
                    capabilities={selectedMusicModelView?.capabilities ?? null}
                    generating={busy}
                    submitDisabled={submitDisabled}
                    credits={credits}
                    onChange={setMusicSettings}
                    onClose={onClose}
                    onSubmit={submit}
                  />
                ) : null}
              </>
            ) : null}
          </div>

          {kind !== "music" ? (
            <div className={kind === "video" ? VIDEO_PANEL_FOOTER_CLASS : GENERATION_PANEL_FOOTER_CLASS}>
              {kind === "video" ? (
                <GenerationVideoStudioToolbar
                  locale={locale}
                  generating={busy}
                  submitDisabled={submitDisabled}
                  insufficientCredits={insufficientCredits}
                  tokenBalance={normalizeCanvasTokenBalance(tokenBalance)}
                  credits={credits}
                  settingsLabel={settingsLabel}
                  videoReferenceMode={videoReferenceMode}
                  allowedReferenceModes={allowedVideoReferenceModes}
                  videoSettings={videoSettings}
                  selectedVideoModelView={selectedVideoModelView}
                  onVideoReferenceModeChange={setVideoReferenceMode}
                  onVideoSettingsChange={setVideoSettings}
                  onClose={onClose}
                  onSubmit={submit}
                />
              ) : (
                <GenerationStudioToolbar
                  locale={locale}
                  kind={kind}
                  generating={busy}
                  submitDisabled={submitDisabled}
                  insufficientCredits={insufficientCredits}
                  tokenBalance={normalizeCanvasTokenBalance(tokenBalance)}
                  credits={credits}
                  settingsLabel={settingsLabel}
                  videoSettings={videoSettings}
                  imageSettings={imageSettings}
                  musicSettings={musicSettings}
                  videoModels={catalog.modelsForKind("video")}
                  imageModels={catalog.modelsForKind("image")}
                  selectedVideoModel={selectedVideoModel}
                  selectedImageModel={selectedImageModel}
                  selectedVideoModelView={selectedVideoModelView}
                  selectedImageModelView={selectedImageModelView}
                  onVideoModelChange={setSelectedVideoModel}
                  onImageModelChange={setSelectedImageModel}
                  onVideoSettingsChange={setVideoSettings}
                  onImageSettingsChange={setImageSettings}
                  videoReferenceMode={videoReferenceMode}
                  onVideoReferenceModeChange={setVideoReferenceMode}
                  onClose={onClose}
                  onSubmit={submit}
                />
              )}
            </div>
          ) : null}
        </div>
      </div>

      <GenerationStudioReferenceHost
        locale={locale}
        projectId={projectId}
        nodes={nodes}
        reference={references.reference}
        lastFrameReference={references.lastFrameReference}
        referenceTarget={references.referenceTarget}
        showAssetLibrary={references.showAssetLibrary}
        assetLibrarySlot={references.assetLibrarySlot}
        showCanvasPicker={references.showCanvasPicker}
        canvasPickerSlot={references.canvasPickerSlot}
        uploadingReference={references.uploadingReference}
        localInputRef={references.localInputRef}
        onReferenceChange={(ref) => {
          if (ref?.source === "library" && references.referenceTarget === "primary") {
            references.upsertLibrarySelection(ref);
            return;
          }
          references.assignReference(ref);
        }}
        onCloseAssetLibrary={() => references.setShowAssetLibrary(false)}
        onCloseCanvasPicker={() => references.setShowCanvasPicker(false)}
        onLocalFileSelected={references.handleLocalFile}
        onUploadReference={references.uploadLibraryAsset}
      />
    </>
  );
}
