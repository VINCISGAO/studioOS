"use client";

import type { StoredProjectReference } from "@/lib/campaign-types";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { Locale } from "@/lib/i18n";
import type { BrandAssetSlotId } from "@/lib/studioos/brand-creative-brief-options";
import type { BrandBriefAssetPreviews } from "@/components/studioos/brand-creative-brief/use-brand-brief-asset-uploads";
import {
  Bot,
  Camera,
  Clapperboard,
  Film,
  Gem,
  Minimize2,
  Monitor,
  Palette,
  PenLine,
  Shirt,
  Smartphone,
  Smile,
  Sparkles,
  Square,
  Sun,
  Zap
} from "lucide-react";

export const styleIconMap = {
  film: Film,
  gem: Gem,
  minimize: Minimize2,
  camera: Camera,
  sun: Sun,
  shirt: Shirt,
  sparkles: Sparkles,
  smile: Smile,
  zap: Zap,
  bot: Bot,
  clapperboard: Clapperboard,
  palette: Palette
} as const;

const ASPECT_RATIO_SHAPES: Record<string, [number, number]> = {
  "21:9": [21, 9],
  "16:9": [16, 9],
  "4:3": [4, 3],
  "4:5": [4, 5],
  "1:1": [1, 1],
  "9:16": [9, 16]
};

function AspectRatioShape({ ratio }: { ratio: string }) {
  const [widthUnits, heightUnits] = ASPECT_RATIO_SHAPES[ratio] ?? [16, 9];
  const max = 20;
  const scale = max / Math.max(widthUnits, heightUnits);
  return (
    <span
      className="inline-block rounded-sm border-2 border-current"
      style={{ width: widthUnits * scale, height: heightUnits * scale }}
      aria-hidden
    />
  );
}

export function AspectIcon({ ratio }: { ratio: string }) {
  if (ratio === "custom") return <PenLine className="h-5 w-5" />;
  if (ratio in ASPECT_RATIO_SHAPES) return <AspectRatioShape ratio={ratio} />;
  if (ratio === "16:9") return <Monitor className="h-5 w-5" />;
  if (ratio === "1:1") return <Square className="h-5 w-5" />;
  return <Smartphone className="h-5 w-5" />;
}

export function toggleList(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export type BriefSectionsProps = {
  locale: Locale;
  form: BriefFormState;
  patch: <K extends keyof BriefFormState>(key: K, value: BriefFormState[K]) => void;
  budgetCustom: string;
  budgetIsCustom: boolean;
  onSelectPresetBudget: (value: string) => void;
  onBudgetCustomChange: (raw: string) => void;
  onBudgetCustomBlur: () => void;
  onAspectRatioSelect: (value: BriefFormState["aspectRatio"]) => void;
  references: StoredProjectReference[];
  refUrl: string;
  setRefUrl: (value: string) => void;
  onAddRef: () => void;
  onRemoveRef: (id: string) => void;
  onPolish: () => void;
  isPolishing: boolean;
  isRefPending: boolean;
  isReferenceVideoUploading: boolean;
  isPending: boolean;
  isUploading: boolean;
  productReady: boolean;
  assetPreviews: BrandBriefAssetPreviews;
  assetUploadErrors: Partial<Record<BrandAssetSlotId, string>>;
  uploadingAssetSlot: BrandAssetSlotId | null;
  referenceVideoUploadProgress: number | null;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  onAssetSlotClick: (slot: BrandAssetSlotId) => void;
  onImageFileSelected: (file: File) => void;
  referenceVideoInputRef: React.RefObject<HTMLInputElement | null>;
  onReferenceVideoFileSelected: (file: File) => void;
  previewUrl: string | null;
  onUploadClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadFile: (file: File) => void;
  onReferenceVideoUploadClick: () => void;
  onUploadReferenceVideo: (file: File) => void;
  uploadError: string | null;
  copy: Record<string, string>;
  hideProduction?: boolean;
  hideBrandAssets?: boolean;
  hideCreativeDirection?: boolean;
  hideMoreDetails?: boolean;
  hideOptimizerPanel?: boolean;
  hideProjectOverview?: boolean;
  hideScheduleFields?: boolean;
  hideTimeline?: boolean;
  hideBudget?: boolean;
  budgetOnly?: boolean;
  budgetSectionNumber?: number;
};
