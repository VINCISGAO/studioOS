"use client";

import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import type { GenerationKind } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    loading: "正在加载 AI 模型…",
    error: "无法加载 AI 模型",
    retry: "重试",
    emptyVideo: "当前没有可用的视频模型",
    emptyImage: "当前没有可用的图片模型",
    emptyMusic: "当前没有可用的音乐模型",
    unavailable: "所选模型已不可用，请重新选择",
    pricingUnavailable: "当前参数无法获取报价，请调整设置后重试"
  },
  en: {
    loading: "Loading AI models…",
    error: "Unable to load AI models",
    retry: "Retry",
    emptyVideo: "No video models are currently available",
    emptyImage: "No image models are currently available",
    emptyMusic: "No music models are currently available",
    unavailable: "Selected model is no longer available",
    pricingUnavailable: "Pricing is unavailable for the current settings"
  }
} as const;

function emptyLabel(kind: GenerationKind, locale: Locale) {
  const t = copy[locale];
  if (kind === "video") return t.emptyVideo;
  if (kind === "image") return t.emptyImage;
  return t.emptyMusic;
}

export function GenerationCatalogLoadingBanner({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <div className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2 text-[11px] text-zinc-500">
      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      {t.loading}
    </div>
  );
}

export function GenerationCatalogErrorBanner({
  locale,
  message,
  onRetry
}: {
  locale: Locale;
  message: string;
  onRetry: () => void;
}) {
  const t = copy[locale];
  return (
    <div className="border-t border-red-100 bg-red-50 px-3 py-2">
      <div className="flex items-start gap-2 text-[11px] text-red-700">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{t.error}</p>
          <p className="mt-0.5 text-red-600">{message}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-white px-2 py-1 text-[10px] font-medium text-red-700 hover:bg-red-50"
        >
          <RefreshCw className="h-3 w-3" />
          {t.retry}
        </button>
      </div>
    </div>
  );
}

export function GenerationCatalogEmptyBanner({
  locale,
  kind
}: {
  locale: Locale;
  kind: GenerationKind;
}) {
  return (
    <div className="border-t border-zinc-100 px-3 py-2 text-[11px] text-zinc-500">
      {emptyLabel(kind, locale)}
    </div>
  );
}

export function GenerationModelUnavailableBanner({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <div className="border-t border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
      {t.unavailable}
    </div>
  );
}

export function GenerationPricingUnavailableBanner({
  locale,
  message
}: {
  locale: Locale;
  message?: string | null;
}) {
  const t = copy[locale];
  return (
    <div className={cn("border-t border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-800")}>
      {message ?? t.pricingUnavailable}
    </div>
  );
}
