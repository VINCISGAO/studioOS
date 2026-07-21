"use client";

import { useState } from "react";
import {
  BarChart3,
  Camera,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  X,
  Zap
} from "lucide-react";
import { GenerationCameraPicker } from "@/components/canvas/generation-camera-picker";
import { GenerationGptLogo } from "@/components/canvas/generation-gpt-logo";
import { GenerationImageModelPicker } from "@/components/canvas/generation-image-model-picker";
import { GenerationImageSettingsPopover } from "@/components/canvas/generation-image-settings-popover";
import { GenerationModelPicker } from "@/components/canvas/generation-model-picker";
import { GenerationReferenceMenu } from "@/components/canvas/generation-reference-menu";
import { GenerationVideoSettingsPopover } from "@/components/canvas/generation-video-settings-popover";
import {
  getImageModelDisplayLabel,
  getVideoModelDisplayLabel,
  type GenerationKind,
  type ImageGenerationSettings,
  type ImageModelId,
  type MusicGenerationSettings,
  type MusicModelVersion,
  type VideoGenerationSettings,
  type VideoModelId,
  type VideoReferenceMode
} from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ToolbarMenu = "settings" | "model" | "camera" | null;

export function GenerationStudioToolbar({
  locale,
  kind,
  generating,
  submitDisabled,
  credits,
  settingsLabel,
  videoSettings,
  imageSettings,
  musicSettings,
  selectedVideoModel,
  selectedImageModel,
  selectedMusicModel,
  onVideoModelChange,
  onImageModelChange,
  onMusicModelChange,
  onVideoSettingsChange,
  onImageSettingsChange,
  videoReferenceMode,
  onVideoReferenceModeChange,
  onClose,
  onSubmit
}: {
  locale: Locale;
  kind: GenerationKind;
  generating: boolean;
  submitDisabled: boolean;
  credits: number;
  settingsLabel: string;
  videoSettings: VideoGenerationSettings;
  imageSettings: ImageGenerationSettings;
  musicSettings: MusicGenerationSettings;
  selectedVideoModel: VideoModelId;
  selectedImageModel: ImageModelId;
  selectedMusicModel: MusicModelVersion;
  onVideoModelChange: (modelId: VideoModelId) => void;
  onImageModelChange: (modelId: ImageModelId) => void;
  onMusicModelChange: (modelId: MusicModelVersion) => void;
  onVideoSettingsChange: (settings: VideoGenerationSettings) => void;
  onImageSettingsChange: (settings: ImageGenerationSettings) => void;
  videoReferenceMode: VideoReferenceMode;
  onVideoReferenceModeChange: (mode: VideoReferenceMode) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<ToolbarMenu>(null);
  const videoModelLabel = getVideoModelDisplayLabel(selectedVideoModel);
  const imageModelLabel = getImageModelDisplayLabel(selectedImageModel);
  const cameraActive = videoSettings.cameraMovements.length > 0;
  const isVideo = kind === "video";
  const isImage = kind === "image";
  const isMusic = kind === "music";
  const settingsOpen = openMenu === "settings";

  function toggleMenu(menu: ToolbarMenu) {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  return (
    <div className="flex items-center gap-2 overflow-visible border-t border-zinc-100 px-3 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-visible">
      {isVideo ? (
        <GenerationReferenceMenu
          locale={locale}
          mode={videoReferenceMode}
          onModeChange={onVideoReferenceModeChange}
        />
      ) : null}

      {!isMusic ? (
      <div className="relative shrink-0 overflow-visible">
        <button
          type="button"
          onClick={() => (isVideo || isImage) && toggleMenu("settings")}
          disabled={!isVideo && !isImage}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 text-[11px] text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40",
            isImage ? "border-transparent bg-transparent px-0 hover:bg-transparent" : "border-zinc-200"
          )}
        >
          {settingsLabel}
          {settingsOpen && (isImage || isVideo) ? (
            <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          )}
        </button>
        {settingsOpen && isVideo ? (
          <GenerationVideoSettingsPopover
            locale={locale}
            settings={videoSettings}
            onChange={onVideoSettingsChange}
            onClose={() => setOpenMenu(null)}
          />
        ) : null}
        {settingsOpen && isImage ? (
          <GenerationImageSettingsPopover
            locale={locale}
            settings={imageSettings}
            onChange={onImageSettingsChange}
          />
        ) : null}
      </div>
      ) : null}

      {isVideo ? (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => toggleMenu("camera")}
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition",
              cameraActive
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
            )}
          >
            <Camera className="h-4 w-4" />
          </button>
          {openMenu === "camera" ? (
            <GenerationCameraPicker
              locale={locale}
              selected={videoSettings.cameraMovements}
              onChange={(cameraMovements) =>
                onVideoSettingsChange({ ...videoSettings, cameraMovements })
              }
              onClose={() => setOpenMenu(null)}
            />
          ) : null}
        </div>
      ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {!isMusic ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => (isVideo || isImage) && toggleMenu("model")}
            disabled={!isVideo && !isImage}
            className="inline-flex h-8 max-w-[108px] shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 text-[11px] text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            {isImage ? (
              <GenerationGptLogo className="h-4 w-4 shrink-0 text-zinc-900" />
            ) : isVideo ? (
              <BarChart3 className="h-4 w-4 shrink-0" />
            ) : null}
            <span className="truncate">
              {isVideo ? videoModelLabel : isImage ? imageModelLabel : ""}
            </span>
            {(isVideo || isImage) ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            ) : null}
          </button>
          {openMenu === "model" && isVideo ? (
            <GenerationModelPicker
              locale={locale}
              selectedModel={selectedVideoModel}
              onSelect={onVideoModelChange}
              onClose={() => setOpenMenu(null)}
            />
          ) : null}
          {openMenu === "model" && isImage ? (
            <GenerationImageModelPicker
              locale={locale}
              selectedModel={selectedImageModel}
              onSelect={onImageModelChange}
              onClose={() => setOpenMenu(null)}
            />
          ) : null}
        </div>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
          aria-label={locale === "zh" ? "关闭" : "Close"}
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={submitDisabled}
          onClick={onSubmit}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200/80 disabled:opacity-40"
        >
          {generating ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          {credits}
        </button>
      </div>
    </div>
  );
}
