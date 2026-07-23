"use client";

import { Music2, Sparkles, X } from "lucide-react";
import {
  GenerationCatalogEmptyBanner,
  GenerationCatalogErrorBanner,
  GenerationModelUnavailableBanner,
  GenerationPricingUnavailableBanner
} from "@/components/canvas/generation-catalog-status";
import { GenerationVideoHeader } from "@/components/canvas/generation-video-header";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import {
  GenerationVideoKindCards
} from "@/components/canvas/generation-video-kind-cards";
import { CanvasInsufficientCreditsBanner } from "@/components/canvas/canvas-insufficient-credits-banner";
import {
  VIDEO_PANEL_CONTENT_CLASS,
  VIDEO_PANEL_AI_INSPIRATION_BUTTON,
  VIDEO_PANEL_HINT,
  VIDEO_PANEL_PROMPT_BLOCK,
  VIDEO_PANEL_PROMPT_BOX,
  VIDEO_PANEL_PROMPT_COUNTER,
  VIDEO_PANEL_PROMPT_FOOTER,
  VIDEO_PANEL_PROMPT_INPUT,
  VIDEO_PANEL_PROMPT_TITLE
} from "@/lib/canvas/generation-video-panel-design";
import type { GenerationReference } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";

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

const PROMPT_MAX = 500;

export function GenerationVideoStudioSection({
  locale,
  prompt,
  reference,
  catalogError,
  catalogEmpty,
  modelUnavailable,
  pricingUnavailable,
  pricingError,
  insufficientCredits,
  tokenBalance,
  credits,
  referenceSlot,
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
  onClearReference,
  onCatalogRetry
}: {
  locale: Locale;
  prompt: string;
  reference: GenerationReference | null;
  catalogError: string | null;
  catalogEmpty: boolean;
  modelUnavailable: boolean;
  pricingUnavailable: boolean;
  pricingError: string | null;
  insufficientCredits: boolean;
  tokenBalance: number;
  credits: number;
  referenceSlot: GenerationReferenceSlot;
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
  onClearReference: () => void;
  onCatalogRetry: () => void;
}) {
  const t = copy[locale];

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

      <GenerationVideoKindCards
        selectedSlot={referenceSlot}
        locale={locale}
        onSelectVideo={onSelectVideo}
        onSelectImage={onSelectImage}
        onSelectAudio={onSelectAudio}
        onReferenceLocal={onReferenceLocal}
        onReferenceLibrary={onReferenceLibrary}
        onReferenceCanvas={onReferenceCanvas}
      />

      <div className={VIDEO_PANEL_PROMPT_BLOCK}>
        <h3 className={VIDEO_PANEL_PROMPT_TITLE}>{t.promptTitle}</h3>
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

        {reference?.mimeType?.startsWith("audio/") ? (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
            <Music2 className="h-4 w-4 shrink-0 text-zinc-500" />
            <span className="min-w-0 flex-1 truncate text-xs text-zinc-700">
              {reference.fileName}
            </span>
            <button
              type="button"
              onClick={onClearReference}
              className="rounded-full p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
              aria-label={locale === "zh" ? "移除参考音频" : "Remove reference audio"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <div className={VIDEO_PANEL_PROMPT_FOOTER}>
          <div className={VIDEO_PANEL_HINT}>
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            {t.promptHint}
          </div>
          <button type="button" className={VIDEO_PANEL_AI_INSPIRATION_BUTTON}>
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            {t.aiInspiration}
          </button>
        </div>

        {insufficientCredits ? (
          <div className="mt-2">
            <CanvasInsufficientCreditsBanner
              locale={locale}
              tokenBalance={tokenBalance}
              credits={credits}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
