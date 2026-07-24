"use client";

import { useEffect, useRef, useState } from "react";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import { useGenerationStudioReferences } from "@/components/canvas/hooks/use-generation-studio-references";
import {
  GENERATION_STUDIO_DRAFT_VERSION,
  readGenerationStudioDraft,
  writeGenerationStudioDraft,
  type GenerationStudioDraft
} from "@/lib/canvas/generation-studio-draft";
import {
  DEFAULT_IMAGE_SETTINGS,
  DEFAULT_MUSIC_SETTINGS,
  DEFAULT_VIDEO_SETTINGS,
  type GenerationKind,
  type ImageGenerationSettings,
  type MusicGenerationSettings,
  type VideoGenerationSettings,
  type VideoReferenceMode
} from "@/lib/canvas/generation-ui";

export function useGenerationStudioDraft(projectId: string, initialKind: GenerationKind) {
  const hydratedRef = useRef(false);
  const storedDraft = useRef<GenerationStudioDraft | null>(null);
  if (!hydratedRef.current) {
    storedDraft.current = readGenerationStudioDraft(projectId, initialKind);
    hydratedRef.current = true;
  }
  const stored = storedDraft.current;

  const [kind, setKind] = useState<GenerationKind>(() => stored?.kind ?? initialKind);
  const [referenceSlot, setReferenceSlot] = useState<GenerationReferenceSlot>(
    () => stored?.referenceSlot ?? (initialKind === "music" ? "audio" : "video")
  );
  const [prompt, setPrompt] = useState(() => stored?.prompt ?? "");
  const [videoSettings, setVideoSettings] = useState<VideoGenerationSettings>(
    () => stored?.videoSettings ?? DEFAULT_VIDEO_SETTINGS
  );
  const [imageSettings, setImageSettings] = useState<ImageGenerationSettings>(
    () => stored?.imageSettings ?? DEFAULT_IMAGE_SETTINGS
  );
  const [selectedVideoModel, setSelectedVideoModel] = useState(
    () => stored?.selectedVideoModel ?? ""
  );
  const [selectedImageModel, setSelectedImageModel] = useState(
    () => stored?.selectedImageModel ?? ""
  );
  const [musicSettings, setMusicSettings] = useState<MusicGenerationSettings>(
    () => stored?.musicSettings ?? DEFAULT_MUSIC_SETTINGS
  );
  const [selectedMusicModel, setSelectedMusicModel] = useState(
    () => stored?.selectedMusicModel ?? ""
  );
  const [videoReferenceMode, setVideoReferenceMode] = useState<VideoReferenceMode>(
    () => stored?.videoReferenceMode ?? "reference"
  );
  const [showUploadMenu, setShowUploadMenu] = useState(false);

  const references = useGenerationStudioReferences(projectId, {
    reference: stored?.reference ?? null,
    lastFrameReference: stored?.lastFrameReference ?? null,
    librarySelections: stored?.librarySelections ?? []
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      writeGenerationStudioDraft(projectId, {
        version: GENERATION_STUDIO_DRAFT_VERSION,
        kind,
        prompt,
        referenceSlot,
        videoSettings,
        imageSettings,
        musicSettings,
        selectedVideoModel,
        selectedImageModel,
        selectedMusicModel,
        videoReferenceMode,
        reference: references.reference,
        lastFrameReference: references.lastFrameReference,
        librarySelections: references.librarySelections
      });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [
    projectId,
    kind,
    prompt,
    referenceSlot,
    videoSettings,
    imageSettings,
    musicSettings,
    selectedVideoModel,
    selectedImageModel,
    selectedMusicModel,
    videoReferenceMode,
    references.reference,
    references.lastFrameReference,
    references.librarySelections
  ]);

  return {
    kind,
    setKind,
    referenceSlot,
    setReferenceSlot,
    prompt,
    setPrompt,
    videoSettings,
    setVideoSettings,
    imageSettings,
    setImageSettings,
    selectedVideoModel,
    setSelectedVideoModel,
    selectedImageModel,
    setSelectedImageModel,
    musicSettings,
    setMusicSettings,
    selectedMusicModel,
    setSelectedMusicModel,
    videoReferenceMode,
    setVideoReferenceMode,
    showUploadMenu,
    setShowUploadMenu,
    references
  };
}
