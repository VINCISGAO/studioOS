"use client";

import { useEffect, useState } from "react";
import { ImageIcon, MousePointer2, Music2, Paperclip, UserPlus, Video } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type GenerationReferenceSlot = "video" | "image" | "audio";

const copy = {
  zh: {
    video: "视频",
    image: "图片",
    audio: "音频",
    localUploadVideo: "从本地上传视频",
    localUploadImage: "从本地上传图片",
    localUploadAudio: "从本地上传音频",
    library: "从素材库选择",
    canvas: "从画布选择"
  },
  en: {
    video: "Video",
    image: "Image",
    audio: "Audio",
    localUploadVideo: "Upload video from local",
    localUploadImage: "Upload image from local",
    localUploadAudio: "Upload audio from local",
    library: "Select from library",
    canvas: "Select from canvas"
  }
} as const;

function localUploadLabel(slot: GenerationReferenceSlot, locale: Locale) {
  const t = copy[locale];
  if (slot === "video") return t.localUploadVideo;
  if (slot === "audio") return t.localUploadAudio;
  return t.localUploadImage;
}

export function GenerationKindSelector({
  selectedSlot,
  locale,
  onSelectVideo,
  onSelectImage,
  onSelectAudio,
  onReferenceLocal,
  onReferenceLibrary,
  onReferenceCanvas
}: {
  selectedSlot: GenerationReferenceSlot;
  locale: Locale;
  onSelectVideo: () => void;
  onSelectImage: () => void;
  onSelectAudio: () => void;
  onReferenceLocal: (slot: GenerationReferenceSlot) => void;
  onReferenceLibrary: (slot: GenerationReferenceSlot) => void;
  onReferenceCanvas: (slot: GenerationReferenceSlot) => void;
}) {
  const t = copy[locale];
  const [openMenuSlot, setOpenMenuSlot] = useState<GenerationReferenceSlot | null>(null);

  useEffect(() => {
    if (openMenuSlot && openMenuSlot !== selectedSlot) setOpenMenuSlot(null);
  }, [openMenuSlot, selectedSlot]);

  const items = [
    { id: "video" as const, label: t.video, Icon: Video, onSelect: onSelectVideo },
    { id: "image" as const, label: t.image, Icon: ImageIcon, onSelect: onSelectImage },
    { id: "audio" as const, label: t.audio, Icon: Music2, onSelect: onSelectAudio }
  ];

  return (
    <div className="flex gap-1.5">
      {items.map(({ id, label, Icon, onSelect }) => {
        const active = selectedSlot === id;
        const menuOpen = openMenuSlot === id;

        return (
          <div key={id} className="relative">
            <button
              type="button"
              onClick={() => {
                onSelect();
                if (id === "audio") {
                  setOpenMenuSlot(null);
                  return;
                }
                setOpenMenuSlot((current) => (current === id ? null : id));
              }}
              className={cn(
                "flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-xl border transition",
                active
                  ? "border-zinc-900 bg-zinc-50 text-zinc-900"
                  : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
            {active && menuOpen && id !== "audio" ? (
              <div className="absolute left-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-xl">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50"
                  onClick={() => {
                    setOpenMenuSlot(null);
                    onReferenceLocal(id);
                  }}
                >
                  <Paperclip className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm text-zinc-800">{localUploadLabel(id, locale)}</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50"
                  onClick={() => {
                    setOpenMenuSlot(null);
                    onReferenceLibrary(id);
                  }}
                >
                  <UserPlus className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm text-zinc-800">{t.library}</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50"
                  onClick={() => {
                    setOpenMenuSlot(null);
                    onReferenceCanvas(id);
                  }}
                >
                  <MousePointer2 className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm text-zinc-800">{t.canvas}</span>
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
