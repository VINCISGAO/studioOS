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
import type { PublicAiModelView } from "@/features/canvas/ai-model-catalog.types";
import { videoReferenceModesForCapabilities } from "@/lib/canvas/ai-model-settings";
import {
  truncateModelDisplayLabel,
  type GenerationKind,
  type ImageGenerationSettings,
  type MusicGenerationSettings,
  type VideoGenerationSettings,
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
  insufficientCredits,
  tokenBalance,
  credits,
  settingsLabel,
  videoSettings,
  imageSettings,
  musicSettings,
  videoModels,
  imageModels,
  selectedVideoModel,
  selectedImageModel,
  selectedVideoModelView,
  selectedImageModelView,
  onVideoModelChange,
  onImageModelChange,
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
  insufficientCredits: boolean;
  tokenBalance: number;
  credits: number;
  settingsLabel: string;
  videoSettings: VideoGenerationSettings;
  imageSettings: ImageGenerationSettings;
  musicSettings: MusicGenerationSettings;
  videoModels: PublicAiModelView[];
  imageModels: PublicAiModelView[];
  selectedVideoModel: string;
  selectedImageModel: string;
  selectedVideoModelView: PublicAiModelView | null;
  selectedImageModelView: PublicAiModelView | null;
  onVideoModelChange: (modelId: string) => void;
  onImageModelChange: (modelId: string) => void;
  onVideoSettingsChange: (settings: VideoGenerationSettings) => void;
  onImageSettingsChange: (settings: ImageGenerationSettings) => void;
  videoReferenceMode: VideoReferenceMode;
  onVideoReferenceModeChange: (mode: VideoReferenceMode) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<ToolbarMenu>(null);
  const videoModelLabel = truncateModelDisplayLabel(
    selectedVideoModelView?.displayName ?? selectedVideoModel
  );
  const imageModelLabel = truncateModelDisplayLabel(
    selectedImageModelView?.displayName ?? selectedImageModel
  );
  const cameraActive = videoSettings.cameraMovements.length > 0;
  const isVideo = kind === "video";
  const isImage = kind === "image";
  const isMusic = kind === "music";
  const settingsOpen = openMenu === "settings";
  const videoCapabilities = selectedVideoModelView?.capabilities ?? null;
  const imageCapabilities = selectedImageModelView?.capabilities ?? null;
  const videoReferenceModes = videoCapabilities
    ? videoReferenceModesForCapabilities(videoCapabilities)
    : (["reference"] as VideoReferenceMode[]);

  function toggleMenu(menu: ToolbarMenu) {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  return (
    <div className="relative isolate z-30 border-t border-zinc-100 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {isVideo ? (
            <GenerationReferenceMenu
              locale={locale}
              mode={videoReferenceMode}
              allowedModes={videoReferenceModes}
              onModeChange={onVideoReferenceModeChange}
            />
          ) : null}

          {!isMusic ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => (isVideo || isImage) && toggleMenu("settings")}
                disabled={!isVideo && !isImage}
                className={cn(
                  "inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 text-[11px] text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40",
                  isImage
                    ? "border-transparent bg-transparent px-0 hover:bg-transparent"
                    : "border-zinc-200 bg-white"
                )}
              >
                <span>{settingsLabel}</span>
                {settingsOpen && (isImage || isVideo) ? (
                  <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                )}
              </button>
              {settingsOpen && isVideo && videoCapabilities ? (
                <GenerationVideoSettingsPopover
                  locale={locale}
                  settings={videoSettings}
                  capabilities={videoCapabilities}
                  onChange={onVideoSettingsChange}
                  onClose={() => setOpenMenu(null)}
                />
              ) : null}
              {settingsOpen && isImage && imageCapabilities ? (
                <GenerationImageSettingsPopover
                  locale={locale}
                  settings={imageSettings}
                  capabilities={imageCapabilities}
                  onChange={onImageSettingsChange}
                />
              ) : null}
            </div>
          ) : null}

          {isVideo ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu("camera")}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full border transition",
                  cameraActive
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
                )}
                aria-label={locale === "zh" ? "镜头运动" : "Camera moves"}
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

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {!isMusic ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => (isVideo || isImage) && toggleMenu("model")}
                disabled={!isVideo && !isImage}
                className="inline-flex h-8 max-w-[168px] items-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-2.5 text-[11px] text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
              >
                {isImage ? (
                  <GenerationGptLogo className="h-4 w-4 shrink-0 text-zinc-900" />
                ) : isVideo ? (
                  <BarChart3 className="h-4 w-4 shrink-0 text-zinc-700" />
                ) : null}
                <span className="min-w-0 truncate">
                  {isVideo ? videoModelLabel : isImage ? imageModelLabel : ""}
                </span>
                {isVideo || isImage ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                ) : null}
              </button>
              {openMenu === "model" && isVideo ? (
                <GenerationModelPicker
                  locale={locale}
                  models={videoModels}
                  selectedModel={selectedVideoModel}
                  onSelect={onVideoModelChange}
                  onClose={() => setOpenMenu(null)}
                />
              ) : null}
              {openMenu === "model" && isImage ? (
                <GenerationImageModelPicker
                  locale={locale}
                  models={imageModels}
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
            aria-label={locale === "zh" ? "关闭" : "Close"}
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={submitDisabled}
            onClick={onSubmit}
            title={
              insufficientCredits
                ? locale === "zh"
                  ? `积分不足（需要 ${credits}，当前 ${tokenBalance}）`
                  : `Insufficient credits (need ${credits}, have ${tokenBalance})`
                : locale === "zh"
                  ? `生成并扣除 ${credits} 积分`
                  : `Generate for ${credits} credits`
            }
            className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200/80 disabled:cursor-not-allowed disabled:opacity-40"
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
    </div>
  );
}
