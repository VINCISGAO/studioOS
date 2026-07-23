"use client";

import { useEffect, useState } from "react";
import { Music2, X } from "lucide-react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import {
  GenerationCatalogEmptyBanner,
  GenerationCatalogErrorBanner,
  GenerationCatalogLoadingBanner,
  GenerationModelUnavailableBanner,
  GenerationPricingUnavailableBanner
} from "@/components/canvas/generation-catalog-status";
import { GenerationImageReferenceSlot } from "@/components/canvas/generation-image-reference-slot";
import {
  GenerationKindSelector,
  type GenerationReferenceSlot
} from "@/components/canvas/generation-kind-selector";
import { GenerationMusicSettingsPanel } from "@/components/canvas/generation-music-settings-panel";
import { GenerationStudioReferenceHost } from "@/components/canvas/generation-studio-reference-host";
import { GenerationStudioToolbar } from "@/components/canvas/generation-studio-toolbar";
import { GenerationVideoHeader } from "@/components/canvas/generation-video-header";
import { useCanvasAiModels } from "@/components/canvas/hooks/use-canvas-ai-models";
import { useGenerationStudioReferences } from "@/components/canvas/hooks/use-generation-studio-references";
import { useGenerationCreditQuote } from "@/components/canvas/hooks/use-generation-credit-quote";
import {
  clampImageSettings,
  clampMusicSettings,
  clampVideoSettings,
  videoReferenceModesForCapabilities
} from "@/lib/canvas/ai-model-settings";
import {
  DEFAULT_IMAGE_SETTINGS,
  DEFAULT_MUSIC_SETTINGS,
  DEFAULT_VIDEO_SETTINGS,
  GENERATION_MUSIC_PANEL_WIDTH,
  GENERATION_PANEL_WIDTH,
  canSubmitMusicSettings,
  formatImageSettingsLabel,
  formatMusicSettingsLabel,
  formatVideoSettingsLabel,
  type GenerationKind,
  type ImageGenerationSettings,
  type MusicGenerationSettings,
  type VideoGenerationSettings,
  type VideoReferenceMode
} from "@/lib/canvas/generation-ui";
import {
  buildGenerationSubmitInput,
  type GenerationSubmitInput
} from "@/lib/canvas/generation-submit";
import { normalizeCanvasTokenBalance } from "@/lib/canvas/generation-credits";
import { CanvasInsufficientCreditsBanner } from "@/components/canvas/canvas-insufficient-credits-banner";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: { placeholder: "今天我们要创作什么" },
  en: { placeholder: "What are we creating today?" }
} as const;

function panelWidth(kind: GenerationKind) {
  return kind === "music" ? GENERATION_MUSIC_PANEL_WIDTH : GENERATION_PANEL_WIDTH;
}

export function GenerationStudioPanel({
  kind: initialKind,
  locale,
  projectId,
  busy,
  anchor,
  anchorPlacement = "above",
  tokenBalance,
  onClose,
  onSubmit
}: {
  kind: GenerationKind;
  locale: Locale;
  projectId: string;
  busy: boolean;
  anchor: { x: number; y: number };
  anchorPlacement?: "above" | "below";
  tokenBalance: number;
  onClose: () => void;
  onSubmit: (input: GenerationSubmitInput) => void;
}) {
  const t = copy[locale];
  const nodes = useCanvasStore((state) => state.nodes);
  const references = useGenerationStudioReferences(projectId);
  const catalog = useCanvasAiModels();
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
  if (submitPreview.reference?.url) quoteParameters.referenceUrl = submitPreview.reference.url;
  if (submitPreview.reference?.nodeId) quoteParameters.referenceNodeId = submitPreview.reference.nodeId;

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

  const credits = quote.credits;
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
  const pricingUnavailable = quoteEnabled && !quote.loading && Boolean(quote.error);
  const insufficientCredits = quote.credits > 0 ? tokenBalance < quote.credits : false;
  const promptTooShort = kind !== "music" && prompt.trim().length < 3;
  const submitDisabled =
    busy ||
    catalog.loading ||
    Boolean(catalog.error) ||
    catalogEmpty ||
    modelUnavailable ||
    quote.loading ||
    pricingUnavailable ||
    quote.credits <= 0 ||
    insufficientCredits ||
    !submitPreview.model ||
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

  function stopCanvasPointer(event: React.PointerEvent) {
    event.stopPropagation();
  }

  const width = panelWidth(kind);

  return (
    <>
      <div
        className="absolute z-[100] max-w-[calc(100vw-24px)]"
        style={{
          left: anchor.x,
          top: anchor.y,
          width,
          transform: anchorPlacement === "below" ? "translate(-50%, 0)" : "translate(-50%, -100%)"
        }}
        onPointerDown={stopCanvasPointer}
        onPointerDownCapture={stopCanvasPointer}
      >
        <div className="overflow-visible rounded-[20px] border border-zinc-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          {catalog.loading ? <GenerationCatalogLoadingBanner locale={locale} /> : null}
          {catalog.error ? (
            <GenerationCatalogErrorBanner
              locale={locale}
              message={catalog.error}
              onRetry={() => void catalog.reload()}
            />
          ) : null}
          {catalogEmpty ? <GenerationCatalogEmptyBanner locale={locale} kind={kind} /> : null}
          {modelUnavailable ? <GenerationModelUnavailableBanner locale={locale} /> : null}
          {pricingUnavailable ? (
            <GenerationPricingUnavailableBanner locale={locale} message={quote.error} />
          ) : null}

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
              <div className="px-3 pb-1 pt-2">
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
                  }}
                  onReferenceLocal={references.pickLocalReference}
                  onReferenceLibrary={references.openReferenceLibrary}
                  onReferenceCanvas={references.openReferenceCanvasPicker}
                />
              </div>
              <div className="px-3 pb-2 pt-1">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={2}
                  maxLength={4000}
                  placeholder={t.placeholder}
                  className="min-h-[64px] w-full resize-none bg-transparent text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400"
                />
                {references.reference?.mimeType?.startsWith("audio/") ? (
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <Music2 className="h-4 w-4 shrink-0 text-zinc-500" />
                    <span className="min-w-0 flex-1 truncate text-xs text-zinc-700">
                      {references.reference.fileName}
                    </span>
                    <button
                      type="button"
                      onClick={() => references.setReference(null)}
                      className="rounded-full p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                      aria-label={locale === "zh" ? "移除参考音频" : "Remove reference audio"}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          <div
            className={cn(
              kind === "music" ? "px-3 pb-3 pt-3" : kind === "image" ? "px-3 pb-1 pt-3" : "hidden"
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
                  className="min-h-[64px] flex-1 resize-none bg-transparent text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400"
                />
              </div>
            ) : kind === "music" ? (
              <>
                {insufficientCredits ? (
                  <div className="mb-3">
                    <CanvasInsufficientCreditsBanner
                      locale={locale}
                      tokenBalance={tokenBalance}
                      credits={credits}
                    />
                  </div>
                ) : null}
                <GenerationMusicSettingsPanel
                  locale={locale}
                  settings={musicSettings}
                  settingsLabel={settingsLabel}
                  models={catalog.modelsForKind("music")}
                  selectedModelId={selectedMusicModel}
                  capabilities={selectedMusicModelView?.capabilities ?? null}
                  generating={busy}
                  submitDisabled={submitDisabled}
                  credits={credits}
                  onChange={setMusicSettings}
                  onModelChange={(modelId) => {
                    setSelectedMusicModel(modelId);
                    setMusicSettings((current) => ({ ...current, modelVersion: modelId }));
                  }}
                  onClose={onClose}
                  onSubmit={submit}
                />
              </>
            ) : null}
          </div>

          {kind !== "music" ? (
            <>
              {insufficientCredits ? (
                <div className="border-t border-amber-100 px-3 py-2">
                  <CanvasInsufficientCreditsBanner
                    locale={locale}
                    tokenBalance={tokenBalance}
                    credits={credits}
                  />
                </div>
              ) : promptTooShort ? (
                <p className="border-t border-zinc-100 px-3 py-1.5 text-[11px] text-zinc-400">
                  {locale === "zh" ? "输入至少 3 个字后可生成" : "Enter at least 3 characters to generate"}
                </p>
              ) : null}
              <GenerationStudioToolbar
                locale={locale}
                kind={kind}
                generating={busy}
                submitDisabled={submitDisabled}
                insufficientCredits={insufficientCredits}
                tokenBalance={normalizeCanvasTokenBalance(tokenBalance)}
                credits={quote.loading ? 0 : credits}
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
            </>
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
