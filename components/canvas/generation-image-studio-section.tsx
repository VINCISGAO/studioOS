"use client";

import {
  GenerationCatalogEmptyBanner,
  GenerationCatalogErrorBanner,
  GenerationCatalogLoadingBanner,
  GenerationModelUnavailableBanner,
  GenerationPricingUnavailableBanner
} from "@/components/canvas/generation-catalog-status";
import { GenerationImageReferenceSlot } from "@/components/canvas/generation-image-reference-slot";
import { GenerationPanelPromptHint } from "@/components/canvas/generation-panel-hint";
import { CanvasInsufficientCreditsBanner } from "@/components/canvas/canvas-insufficient-credits-banner";
import type { GenerationReference } from "@/lib/canvas/generation-ui";
import {
  GENERATION_PANEL_IMAGE_CONTENT_CLASS,
  generationPanelImagePromptClass
} from "@/lib/canvas/generation-panel-design";
import type { Locale } from "@/lib/i18n";

const copy = {
  zh: { placeholder: "今天我们要创作什么" },
  en: { placeholder: "What are we creating today?" }
} as const;

export function GenerationImageStudioSection({
  locale,
  prompt,
  reference,
  catalogLoading,
  catalogError,
  catalogEmpty,
  modelUnavailable,
  pricingUnavailable,
  pricingError,
  insufficientCredits,
  tokenBalance,
  credits,
  onPromptChange,
  onLocalUpload,
  onOpenLibrary,
  onCanvasPick,
  onClearReference,
  onCatalogRetry
}: {
  locale: Locale;
  prompt: string;
  reference: GenerationReference | null;
  catalogLoading: boolean;
  catalogError: string | null;
  catalogEmpty: boolean;
  modelUnavailable: boolean;
  pricingUnavailable: boolean;
  pricingError: string | null;
  insufficientCredits: boolean;
  tokenBalance: number;
  credits: number;
  onPromptChange: (value: string) => void;
  onLocalUpload: () => void;
  onOpenLibrary: () => void;
  onCanvasPick: () => void;
  onClearReference: () => void;
  onCatalogRetry: () => void;
}) {
  const t = copy[locale];

  return (
    <div className={GENERATION_PANEL_IMAGE_CONTENT_CLASS}>
      {catalogLoading ? <GenerationCatalogLoadingBanner locale={locale} /> : null}
      {catalogError ? (
        <div className="pb-2">
          <GenerationCatalogErrorBanner
            locale={locale}
            message={catalogError}
            onRetry={onCatalogRetry}
          />
        </div>
      ) : null}
      {catalogEmpty ? (
        <div className="pb-2">
          <GenerationCatalogEmptyBanner locale={locale} kind="image" />
        </div>
      ) : null}
      {modelUnavailable ? (
        <div className="pb-2">
          <GenerationModelUnavailableBanner locale={locale} />
        </div>
      ) : null}
      {pricingUnavailable ? (
        <div className="pb-2">
          <GenerationPricingUnavailableBanner locale={locale} message={pricingError} />
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <GenerationImageReferenceSlot
          locale={locale}
          reference={reference}
          onLocalUpload={onLocalUpload}
          onOpenLibrary={onOpenLibrary}
          onCanvasPick={onCanvasPick}
          onClear={onClearReference}
        />
        <textarea
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          rows={3}
          maxLength={4000}
          placeholder={t.placeholder}
          className={generationPanelImagePromptClass}
        />
      </div>

      <div className="mt-3">
        {insufficientCredits ? (
          <CanvasInsufficientCreditsBanner
            locale={locale}
            tokenBalance={tokenBalance}
            credits={credits}
          />
        ) : (
          <GenerationPanelPromptHint locale={locale} />
        )}
      </div>
    </div>
  );
}
