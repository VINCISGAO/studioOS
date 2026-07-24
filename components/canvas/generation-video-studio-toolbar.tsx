"use client";

import { useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Film,
  Flower2,
  LoaderCircle,
  SquarePen,
  X,
  Zap
} from "lucide-react";
import { GenerationCameraPickerPanel } from "@/components/canvas/generation-camera-picker";
import {
  GenerationReferenceModePanel
} from "@/components/canvas/generation-reference-menu";
import { GenerationToolbarMenuPortal } from "@/components/canvas/generation-toolbar-menu-portal";
import { GenerationVideoSettingsPanel } from "@/components/canvas/generation-video-settings-popover";
import type { PublicAiModelView } from "@/features/canvas/ai-model-catalog.types";
import { fallbackCapabilitiesForCategory } from "@/lib/canvas/ai-model-catalog-fallback";
import {
  VIDEO_PANEL_FOOTER_CONTROLS,
  VIDEO_PANEL_FOOTER_LEFT,
  VIDEO_PANEL_FOOTER_RIGHT,
  VIDEO_PANEL_FOOTER_ROW,
  videoPanelCloseButtonClass,
  videoPanelSubmitButtonClass,
  videoPanelToolbarIconButtonClass,
  videoPanelToolbarPillClass
} from "@/lib/canvas/generation-video-panel-design";
import {
  type VideoGenerationSettings,
  type VideoReferenceMode
} from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const referenceModeCopy = {
  zh: {
    reference: "参考",
    edit: "视频编辑",
    keyframes: "首尾帧"
  },
  en: {
    reference: "Reference",
    edit: "Video edit",
    keyframes: "Start/end frames"
  }
} as const;

const referenceModeMeta: Record<
  VideoReferenceMode,
  { labelKey: keyof (typeof referenceModeCopy)["zh"]; Icon: typeof Flower2 }
> = {
  reference: { labelKey: "reference", Icon: Flower2 },
  edit: { labelKey: "edit", Icon: SquarePen },
  keyframes: { labelKey: "keyframes", Icon: Film }
};

type ToolbarMenu = "referenceMode" | "settings" | "camera" | null;

function ToolbarPill({
  buttonRef,
  onClick,
  children,
  className
}: {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(videoPanelToolbarPillClass, "nodrag nopan pointer-events-auto", className)}
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
  settingsLabel,
  videoReferenceMode,
  allowedReferenceModes,
  videoSettings,
  selectedVideoModelView,
  onVideoReferenceModeChange,
  onVideoSettingsChange,
  onClose,
  onSubmit
}: {
  locale: Locale;
  generating: boolean;
  submitDisabled: boolean;
  insufficientCredits: boolean;
  tokenBalance: number;
  credits: number;
  settingsLabel: string;
  videoReferenceMode: VideoReferenceMode;
  allowedReferenceModes: VideoReferenceMode[];
  videoSettings: VideoGenerationSettings;
  selectedVideoModelView: PublicAiModelView | null;
  onVideoReferenceModeChange: (mode: VideoReferenceMode) => void;
  onVideoSettingsChange: (settings: VideoGenerationSettings) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<ToolbarMenu>(null);
  const referenceModeRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);
  const cameraRef = useRef<HTMLButtonElement>(null);

  const videoCapabilities =
    selectedVideoModelView?.capabilities ?? fallbackCapabilitiesForCategory("VIDEO");
  const cameraActive = videoSettings.cameraMovements.length > 0;
  const modeMeta = referenceModeMeta[videoReferenceMode];
  const ModeIcon = modeMeta.Icon;
  const modeLabel = referenceModeCopy[locale][modeMeta.labelKey];

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
      <div className={VIDEO_PANEL_FOOTER_LEFT}>
        <div className={VIDEO_PANEL_FOOTER_CONTROLS}>
          <ToolbarPill buttonRef={referenceModeRef} onClick={() => toggleMenu("referenceMode")}>
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-zinc-200/90 bg-zinc-50 text-zinc-600">
              <ModeIcon className="h-3 w-3" />
            </span>
            <span className="max-w-[4.5rem] truncate whitespace-nowrap">{modeLabel}</span>
            {openMenu === "referenceMode" ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            )}
          </ToolbarPill>
          <GenerationToolbarMenuPortal
            open={openMenu === "referenceMode"}
            anchorRef={referenceModeRef}
            menuWidth={196}
            onClose={closeMenu}
          >
            <GenerationReferenceModePanel
              locale={locale}
              mode={videoReferenceMode}
              allowedModes={allowedReferenceModes}
              onModeChange={onVideoReferenceModeChange}
              onClose={closeMenu}
            />
          </GenerationToolbarMenuPortal>

          <button
            ref={cameraRef}
            type="button"
            onClick={() => toggleMenu("camera")}
            onPointerDown={(event) => event.stopPropagation()}
            className={cn(
              videoPanelToolbarIconButtonClass,
              "nodrag nopan pointer-events-auto",
              cameraActive && "border-[#8B5CF6] bg-[#8B5CF6] text-white hover:bg-[#7C3AED]"
            )}
            aria-label={locale === "zh" ? "镜头运动" : "Camera moves"}
          >
            <Camera className="h-4 w-4" />
          </button>
          <GenerationToolbarMenuPortal
            open={openMenu === "camera"}
            anchorRef={cameraRef}
            menuWidth={360}
            onClose={closeMenu}
          >
            <GenerationCameraPickerPanel
              locale={locale}
              selected={videoSettings.cameraMovements}
              onChange={(cameraMovements) =>
                onVideoSettingsChange({ ...videoSettings, cameraMovements })
              }
              onClose={closeMenu}
            />
          </GenerationToolbarMenuPortal>

          <ToolbarPill
            buttonRef={settingsRef}
            onClick={() => toggleMenu("settings")}
            className="min-w-0 max-w-[11rem]"
          >
            <span className="truncate whitespace-nowrap">{settingsLabel}</span>
            {openMenu === "settings" ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            )}
          </ToolbarPill>
          <GenerationToolbarMenuPortal
            open={openMenu === "settings"}
            anchorRef={settingsRef}
            menuWidth={340}
            onClose={closeMenu}
          >
            <GenerationVideoSettingsPanel
              locale={locale}
              settings={videoSettings}
              capabilities={videoCapabilities}
              onChange={onVideoSettingsChange}
            />
          </GenerationToolbarMenuPortal>
        </div>
      </div>

      <div className={VIDEO_PANEL_FOOTER_RIGHT}>
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
                ? `Token 不足（需要 ${credits}，当前 ${tokenBalance}）`
                : `Insufficient Token (need ${credits}, have ${tokenBalance})`
              : locale === "zh"
                ? `生成并扣除 ${credits} Token`
                : `Generate for ${credits} Token`
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
    </div>
  );
}
