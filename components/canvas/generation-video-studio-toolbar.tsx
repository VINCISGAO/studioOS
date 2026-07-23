"use client";

import { useRef, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  LayoutGrid,
  LoaderCircle,
  X,
  Zap
} from "lucide-react";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import { GenerationModelPicker } from "@/components/canvas/generation-model-picker";
import { GenerationReferenceSourceMenu } from "@/components/canvas/generation-reference-source-menu";
import { GenerationToolbarMenuPortal } from "@/components/canvas/generation-toolbar-menu-portal";
import {
  GenerationVideoAspectMenu,
  GenerationVideoDurationMenu,
  GenerationVideoQualityMenu
} from "@/components/canvas/generation-video-quick-setting-menus";
import {
  VideoAspectRatioIcon,
  VideoQualityIcon
} from "@/components/canvas/generation-video-setting-icons";
import type { PublicAiModelView } from "@/features/canvas/ai-model-catalog.types";
import { fallbackCapabilitiesForCategory } from "@/lib/canvas/ai-model-catalog-fallback";
import { formatVideoQualityLabel } from "@/lib/canvas/generation-video-labels";
import {
  VIDEO_PANEL_FOOTER_ROW,
  videoPanelCloseButtonClass,
  videoPanelSubmitButtonClass,
  videoPanelToolbarPillClass
} from "@/lib/canvas/generation-video-panel-design";
import {
  truncateModelDisplayLabel,
  type VideoGenerationSettings
} from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ToolbarMenu = "reference" | "aspect" | "duration" | "quality" | "model" | null;

function ToolbarPill({
  buttonRef,
  onClick,
  children
}: {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(videoPanelToolbarPillClass, "nodrag nopan pointer-events-auto")}
    >
      {children}
    </button>
  );
}

export function GenerationVideoStudioToolbar({
  locale,
  generating,
  submitDisabled,
  insufficientCredits,
  tokenBalance,
  credits,
  referenceSlot,
  videoSettings,
  videoModels,
  selectedVideoModel,
  selectedVideoModelView,
  onVideoModelChange,
  onVideoSettingsChange,
  onLocalUpload,
  onOpenLibrary,
  onOpenCanvasPicker,
  onClose,
  onSubmit
}: {
  locale: Locale;
  generating: boolean;
  submitDisabled: boolean;
  insufficientCredits: boolean;
  tokenBalance: number;
  credits: number;
  referenceSlot: GenerationReferenceSlot;
  videoSettings: VideoGenerationSettings;
  videoModels: PublicAiModelView[];
  selectedVideoModel: string;
  selectedVideoModelView: PublicAiModelView | null;
  onVideoModelChange: (modelId: string) => void;
  onVideoSettingsChange: (settings: VideoGenerationSettings) => void;
  onLocalUpload: () => void;
  onOpenLibrary: () => void;
  onOpenCanvasPicker: () => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<ToolbarMenu>(null);
  const referenceRef = useRef<HTMLButtonElement>(null);
  const aspectRef = useRef<HTMLButtonElement>(null);
  const durationRef = useRef<HTMLButtonElement>(null);
  const qualityRef = useRef<HTMLButtonElement>(null);
  const modelRef = useRef<HTMLButtonElement>(null);

  const videoModelLabel = truncateModelDisplayLabel(
    selectedVideoModelView?.displayName ?? selectedVideoModel
  );
  const videoCapabilities =
    selectedVideoModelView?.capabilities ?? fallbackCapabilitiesForCategory("VIDEO");
  const aspectLabel =
    videoSettings.aspectRatio === "auto" ? "Auto" : videoSettings.aspectRatio;

  function toggleMenu(menu: ToolbarMenu) {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  function closeMenu() {
    setOpenMenu(null);
  }

  return (
    <div
      className={cn(VIDEO_PANEL_FOOTER_ROW, "relative isolate z-30 nodrag nopan pointer-events-auto")}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <ToolbarPill buttonRef={referenceRef} onClick={() => toggleMenu("reference")}>
        <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-[#8B5CF6]" />
        <span>{locale === "zh" ? "参考" : "Reference"}</span>
        {openMenu === "reference" ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        )}
      </ToolbarPill>
      <GenerationToolbarMenuPortal
        open={openMenu === "reference"}
        anchorRef={referenceRef}
        menuWidth={224}
        onClose={closeMenu}
      >
        <GenerationReferenceSourceMenu
          locale={locale}
          slot={referenceSlot}
          onLocalUpload={onLocalUpload}
          onOpenLibrary={onOpenLibrary}
          onOpenCanvasPicker={onOpenCanvasPicker}
          onActionComplete={closeMenu}
        />
      </GenerationToolbarMenuPortal>

      <ToolbarPill buttonRef={aspectRef} onClick={() => toggleMenu("aspect")}>
        <VideoAspectRatioIcon ratio={videoSettings.aspectRatio} />
        <span>{aspectLabel}</span>
        {openMenu === "aspect" ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        )}
      </ToolbarPill>
      <GenerationToolbarMenuPortal
        open={openMenu === "aspect"}
        anchorRef={aspectRef}
        menuWidth={168}
        onClose={closeMenu}
      >
        <GenerationVideoAspectMenu
          locale={locale}
          settings={videoSettings}
          capabilities={videoCapabilities}
          onChange={onVideoSettingsChange}
          onClose={closeMenu}
        />
      </GenerationToolbarMenuPortal>

      <ToolbarPill buttonRef={durationRef} onClick={() => toggleMenu("duration")}>
        <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
        <span>{videoSettings.duration}s</span>
        {openMenu === "duration" ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        )}
      </ToolbarPill>
      <GenerationToolbarMenuPortal
        open={openMenu === "duration"}
        anchorRef={durationRef}
        menuWidth={120}
        onClose={closeMenu}
      >
        <GenerationVideoDurationMenu
          settings={videoSettings}
          capabilities={videoCapabilities}
          onChange={onVideoSettingsChange}
          onClose={closeMenu}
        />
      </GenerationToolbarMenuPortal>

      <ToolbarPill buttonRef={qualityRef} onClick={() => toggleMenu("quality")}>
        <VideoQualityIcon />
        <span>{formatVideoQualityLabel(videoSettings.quality)}</span>
        {openMenu === "quality" ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        )}
      </ToolbarPill>
      <GenerationToolbarMenuPortal
        open={openMenu === "quality"}
        anchorRef={qualityRef}
        menuWidth={120}
        onClose={closeMenu}
      >
        <GenerationVideoQualityMenu
          settings={videoSettings}
          capabilities={videoCapabilities}
          onChange={onVideoSettingsChange}
          onClose={closeMenu}
        />
      </GenerationToolbarMenuPortal>

      <ToolbarPill buttonRef={modelRef} onClick={() => toggleMenu("model")}>
        <BarChart3 className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
        <span className="max-w-[96px] truncate">{videoModelLabel}</span>
        {openMenu === "model" ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        )}
      </ToolbarPill>
      <GenerationToolbarMenuPortal
        open={openMenu === "model"}
        anchorRef={modelRef}
        menuWidth={300}
        align="end"
        onClose={closeMenu}
      >
        <GenerationModelPicker
          locale={locale}
          models={videoModels}
          selectedModel={selectedVideoModel}
          onSelect={onVideoModelChange}
          onClose={closeMenu}
        />
      </GenerationToolbarMenuPortal>

      <button
        type="button"
        onClick={onClose}
        onPointerDown={(event) => event.stopPropagation()}
        className={cn(videoPanelCloseButtonClass, "nodrag nopan pointer-events-auto")}
        aria-label={locale === "zh" ? "关闭" : "Close"}
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        disabled={submitDisabled}
        onClick={onSubmit}
        onPointerDown={(event) => event.stopPropagation()}
        title={
          insufficientCredits
            ? locale === "zh"
              ? `积分不足（需要 ${credits}，当前 ${tokenBalance}）`
              : `Insufficient credits (need ${credits}, have ${tokenBalance})`
            : locale === "zh"
              ? `生成并扣除 ${credits} 积分`
              : `Generate for ${credits} credits`
        }
        className={cn(videoPanelSubmitButtonClass, "nodrag nopan pointer-events-auto")}
      >
        {generating ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Zap className="h-3.5 w-3.5" />
        )}
        {credits}
      </button>
    </div>
  );
}
