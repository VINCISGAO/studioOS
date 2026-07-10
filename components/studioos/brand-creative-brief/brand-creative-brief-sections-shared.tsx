"use client";

import type { StoredProjectReference } from "@/lib/campaign-types";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { Locale } from "@/lib/i18n";
import {
  Bot,
  Camera,
  Clapperboard,
  Film,
  Gem,
  Minimize2,
  Monitor,
  Palette,
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

export function AspectIcon({ ratio }: { ratio: string }) {
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
  isRefPending: boolean;
  isPending: boolean;
  isUploading: boolean;
  productReady: boolean;
  previewUrl: string | null;
  onUploadClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadFile: (file: File) => void;
  uploadError: string | null;
  copy: Record<string, string>;
};
