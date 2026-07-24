"use client";

import { useRef, useState } from "react";
import { BarChart3, ChevronDown, ChevronUp, LoaderCircle, Sparkles } from "lucide-react";
import {
  GenerationCatalogEmptyBanner,
  GenerationCatalogErrorBanner,
  GenerationModelUnavailableBanner,
  GenerationPricingUnavailableBanner
} from "@/components/canvas/generation-catalog-status";
import { GenerationVideoHeader } from "@/components/canvas/generation-video-header";
import { GenerationVideoLibraryPicker } from "@/components/canvas/generation-video-library-picker";
import { GenerationVideoReferenceStrip } from "@/components/canvas/generation-video-reference-strip";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import { GenerationVideoKeyframeSlots } from "@/components/canvas/generation-video-keyframe-slots";
import { GenerationModelPicker } from "@/components/canvas/generation-model-picker";
import { GenerationToolbarMenuPortal } from "@/components/canvas/generation-toolbar-menu-portal";
import { useCanvasPromptEnhance } from "@/components/canvas/hooks/use-canvas-prompt-enhance";
import type { PublicAiModelView } from "@/features/canvas/ai-model-catalog.types";
import {
  VIDEO_PANEL_CONTENT_CLASS,
  VIDEO_PANEL_AI_INSPIRATION_BUTTON,
  VIDEO_PANEL_HINT,
  VIDEO_PANEL_MODEL_ROW,
  VIDEO_PANEL_PROMPT_BLOCK,
  VIDEO_PANEL_PROMPT_BOX,
  VIDEO_PANEL_PROMPT_COUNTER,
  VIDEO_PANEL_PROMPT_FOOTER,
  VIDEO_PANEL_PROMPT_INPUT,
  VIDEO_PANEL_PROMPT_TITLE,
  videoPanelToolbarPillClass
} from "@/lib/canvas/generation-video-panel-design";
import { truncateModelDisplayLabel } from "@/lib/canvas/generation-ui";
import type { GenerationReference, VideoReferenceMode } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    promptTitle: "今天我们要创作什么",
    promptPlaceholder: "描述你的创作想法",
    promptHint: "输入至少 3 个字后可生成",
    aiInspiration: "AI 灵感"
  },
  en: {
    promptTitle: "What are we creating today?",
    promptPlaceholder: "Describe your creative idea",
    promptHint: "Enter at least 3 characters to generate",
    aiInspiration: "AI Ideas"
  }
} as const;

const PROMPT_MAX = 5000;

export function GenerationVideoStudioSection({
  locale,
  projectId,
  prompt,
  catalogError,
  catalogEmpty,
  modelUnavailable,
  pricingUnavailable,
  pricingError,
  referenceSlot,
  videoReferenceMode,
  firstFrameReference,
  lastFrameReference,
  librarySelections,
  activeReferenceId,
  uploadOpen,
  onPromptChange,
  onUploadToggle,
  onLocalUpload,
  onOpenLibrary,
  onOpenCanvasPicker,
  onSelectVideo,
  onSelectImage,
  onSelectAudio,
  onReferenceLocal,
  onReferenceLibrary,
  onReferenceCanvas,
  onToggleLibrarySelection,
  onActivateLibrarySelection,
  onRemoveLibrarySelection,
  onPickFirstFrameLocal,
  onPickFirstFrameLibrary,
  onPickFirstFrameCanvas,
  onPickLastFrameLocal,
  onPickLastFrameLibrary,
  onPickLastFrameCanvas,
  onClearFirstFrame,
  onClearLastFrame,
  onCatalogRetry,
  videoModels,
  selectedVideoModel,
  selectedVideoModelView,
  onVideoModelChange
}: {
  locale: Locale;
  projectId: string;
  prompt: string;
  catalogError: string | null;
  catalogEmpty: boolean;
  modelUnavailable: boolean;
  pricingUnavailable: boolean;
  pricingError: string | null;
  referenceSlot: GenerationReferenceSlot;
  videoReferenceMode: VideoReferenceMode;
  firstFrameReference: GenerationReference | null;
  lastFrameReference: GenerationReference | null;
  librarySelections: GenerationReference[];
  activeReferenceId?: string;
  uploadOpen: boolean;
  onPromptChange: (value: string) => void;
  onUploadToggle: () => void;
  onLocalUpload: () => void;
  onOpenLibrary: () => void;
  onOpenCanvasPicker: () => void;
  onSelectVideo: () => void;
  onSelectImage: () => void;
  onSelectAudio: () => void;
  onReferenceLocal: (slot: GenerationReferenceSlot) => void;
  onReferenceLibrary: (slot: GenerationReferenceSlot) => void;
  onReferenceCanvas: (slot: GenerationReferenceSlot) => void;
  onToggleLibrarySelection: (reference: GenerationReference) => void;
  onActivateLibrarySelection: (reference: GenerationReference) => void;
  onRemoveLibrarySelection: (assetId: string) => void;
  onPickFirstFrameLocal: () => void;
  onPickFirstFrameLibrary: () => void;
  onPickFirstFrameCanvas: () => void;
  onPickLastFrameLocal: () => void;
  onPickLastFrameLibrary: () => void;
  onPickLastFrameCanvas: () => void;
  onClearFirstFrame: () => void;
  onClearLastFrame: () => void;
  onCatalogRetry: () => void;
  videoModels: PublicAiModelView[];
  selectedVideoModel: string;
  selectedVideoModelView: PublicAiModelView | null;
  onVideoModelChange: (modelId: string) => void;
}) {
  const t = copy[locale];
  const { enhance, enhancing, clearError } = useCanvasPromptEnhance(projectId, locale);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const modelRef = useRef<HTMLButtonElement>(null);
  const videoModelLabel = truncateModelDisplayLabel(
    selectedVideoModelView?.displayName ?? selectedVideoModel
  );

  async function handleAiInspiration() {
    clearError();
    const inspired = await enhance("video_prompt", prompt);
    if (inspired) {
      onPromptChange(inspired);
    }
  }

  return (
    <div className={VIDEO_PANEL_CONTENT_CLASS}>
      <GenerationVideoHeader
        locale={locale}
        referenceSlot={referenceSlot}
        uploadOpen={uploadOpen}
        onUploadToggle={onUploadToggle}
        onLocalUpload={onLocalUpload}
        onOpenLibrary={onOpenLibrary}
        onOpenCanvasPicker={onOpenCanvasPicker}
      />

      {catalogError ? (
        <div className="mt-2">
          <GenerationCatalogErrorBanner
            locale={locale}
            message={catalogError}
            onRetry={onCatalogRetry}
          />
        </div>
      ) : null}
      {catalogEmpty ? (
        <div className="mt-2">
          <GenerationCatalogEmptyBanner locale={locale} kind="video" />
        </div>
      ) : null}
      {modelUnavailable ? (
        <div className="mt-2">
          <GenerationModelUnavailableBanner locale={locale} />
        </div>
      ) : null}
      {pricingUnavailable ? (
        <div className="mt-2">
          <GenerationPricingUnavailableBanner locale={locale} message={pricingError} />
        </div>
      ) : null}

      {videoReferenceMode === "keyframes" ? (
        <GenerationVideoKeyframeSlots
          locale={locale}
          firstFrame={firstFrameReference}
          lastFrame={lastFrameReference}
          onPickFirstLocal={onPickFirstFrameLocal}
          onPickFirstLibrary={onPickFirstFrameLibrary}
          onPickFirstCanvas={onPickFirstFrameCanvas}
          onPickLastLocal={onPickLastFrameLocal}
          onPickLastLibrary={onPickLastFrameLibrary}
          onPickLastCanvas={onPickLastFrameCanvas}
          onClearFirst={onClearFirstFrame}
          onClearLast={onClearLastFrame}
        />
      ) : (
        <>
          {videoReferenceMode === "reference" ? (
            <GenerationVideoLibraryPicker
              locale={locale}
              projectId={projectId}
              selectedIds={librarySelections
                .map((item) => item.assetId)
                .filter((id): id is string => Boolean(id))}
              onToggleSelection={onToggleLibrarySelection}
            />
          ) : null}
          <GenerationVideoReferenceStrip
            locale={locale}
            selectedSlot={referenceSlot}
            librarySelections={librarySelections}
            activeReferenceId={activeReferenceId}
            visibleSlots={
              videoReferenceMode === "edit" ? (["image"] as const) : (["video", "image", "audio"] as const)
            }
            onSelectVideo={onSelectVideo}
            onSelectImage={onSelectImage}
            onSelectAudio={onSelectAudio}
            onReferenceLocal={onReferenceLocal}
            onReferenceLibrary={onReferenceLibrary}
            onReferenceCanvas={onReferenceCanvas}
            onActivateSelection={onActivateLibrarySelection}
            onRemoveSelection={onRemoveLibrarySelection}
          />
        </>
      )}

      <div className={VIDEO_PANEL_PROMPT_BLOCK}>
        <h3 className={VIDEO_PANEL_PROMPT_TITLE}>{t.promptTitle}</h3>
        <div className={VIDEO_PANEL_MODEL_ROW}>
          <button
            ref={modelRef}
            type="button"
            onClick={() => setModelMenuOpen((open) => !open)}
            onPointerDown={(event) => event.stopPropagation()}
            className={cn(videoPanelToolbarPillClass, "nodrag nopan pointer-events-auto")}
          >
            <BarChart3 className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
            <span className="max-w-[140px] truncate">{videoModelLabel}</span>
            {modelMenuOpen ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            )}
          </button>
          <GenerationToolbarMenuPortal
            open={modelMenuOpen}
            anchorRef={modelRef}
            menuWidth={300}
            onClose={() => setModelMenuOpen(false)}
          >
            <GenerationModelPicker
              locale={locale}
              models={videoModels}
              selectedModel={selectedVideoModel}
              onSelect={onVideoModelChange}
              onClose={() => setModelMenuOpen(false)}
            />
          </GenerationToolbarMenuPortal>
        </div>
        <div className={VIDEO_PANEL_PROMPT_BOX}>
          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            maxLength={PROMPT_MAX}
            placeholder={t.promptPlaceholder}
            className={VIDEO_PANEL_PROMPT_INPUT}
          />
          <span className={VIDEO_PANEL_PROMPT_COUNTER}>
            {prompt.length}/{PROMPT_MAX}
          </span>
        </div>

        <div className={VIDEO_PANEL_PROMPT_FOOTER}>
          <div className={VIDEO_PANEL_HINT}>
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            {t.promptHint}
          </div>
          <button
            type="button"
            disabled={enhancing}
            onClick={() => void handleAiInspiration()}
            className={VIDEO_PANEL_AI_INSPIRATION_BUTTON}
          >
            {enhancing ? (
              <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
            )}
            {t.aiInspiration}
          </button>
        </div>
      </div>
    </div>
  );
}
