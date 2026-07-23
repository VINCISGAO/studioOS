"use client";

import { useState } from "react";
import {
  BarChart3,
  Camera,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
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
  generationPanelCloseButtonClass,
  generationPanelModelPillClass,
  generationPanelSettingsPillClass,
  generationPanelSubmitButtonClass
} from "@/lib/canvas/generation-panel-design";
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
  void musicSettings;
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

  if (isImage) {
    return (
      <div className="relative isolate z-30 flex items-center justify-between gap-3">
        <div className="relative min-w-0">
          <button
            type="button"
            onClick={() => toggleMenu("settings")}
            disabled={!imageCapabilities}
            className={cn(generationPanelSettingsPillClass, !imageCapabilities && "opacity-40")}
          >
            <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-violet-500" />
            <span className="truncate whitespace-nowrap">{settingsLabel}</span>
            {settingsOpen ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            )}
          </button>
          {settingsOpen && imageCapabilities ? (
            <GenerationImageSettingsPopover
              locale={locale}
              settings={imageSettings}
              capabilities={imageCapabilities}
              onChange={onImageSettingsChange}
            />
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleMenu("model")}
              className={generationPanelModelPillClass}
            >
              <GenerationGptLogo className="h-4 w-4 shrink-0 text-zinc-900" />
              <span className="min-w-0 truncate">{imageModelLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            </button>
            {openMenu === "model" ? (
              <GenerationImageModelPicker
                locale={locale}
                models={imageModels}
                selectedModel={selectedImageModel}
                onSelect={onImageModelChange}
                onClose={() => setOpenMenu(null)}
              />
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={generationPanelCloseButtonClass}
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
            className={generationPanelSubmitButtonClass}
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

  return (
    <div className="relative isolate z-30 flex flex-wrap items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
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
                generationPanelSettingsPillClass,
                "disabled:opacity-40"
              )}
            >
              {isImage ? <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-violet-500" /> : null}
              <span className="whitespace-nowrap">{settingsLabel}</span>
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
                  ? "border-violet-500 bg-violet-500 text-white"
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

      <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
        {!isMusic ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => (isVideo || isImage) && toggleMenu("model")}
              disabled={!isVideo && !isImage}
              className={cn(generationPanelModelPillClass, "disabled:opacity-40")}
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
          className={generationPanelCloseButtonClass}
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
          className={generationPanelSubmitButtonClass}
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
