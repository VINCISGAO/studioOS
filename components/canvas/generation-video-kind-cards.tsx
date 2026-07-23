"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Music2, Video } from "lucide-react";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import { GenerationReferenceSourcePopover } from "@/components/canvas/generation-reference-source-popover";
import {
  VIDEO_PANEL_KIND_GRID,
  VIDEO_PANEL_KIND_ICON,
  VIDEO_PANEL_KIND_TITLE,
  videoPanelKindCardClass
} from "@/lib/canvas/generation-video-panel-design";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    video: "视频",
    image: "图片",
    audio: "音频"
  },
  en: {
    video: "Video",
    image: "Image",
    audio: "Audio"
  }
} as const;

const menuAlignBySlot = {
  video: "start",
  image: "center",
  audio: "end"
} as const;

export function GenerationVideoKindCards({
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
  const videoButtonRef = useRef<HTMLButtonElement>(null);
  const imageButtonRef = useRef<HTMLButtonElement>(null);
  const audioButtonRef = useRef<HTMLButtonElement>(null);
  const buttonRefs = {
    video: videoButtonRef,
    image: imageButtonRef,
    audio: audioButtonRef
  } as const;

  useEffect(() => {
    if (openMenuSlot && openMenuSlot !== selectedSlot) setOpenMenuSlot(null);
  }, [openMenuSlot, selectedSlot]);

  const items = [
    {
      id: "video" as const,
      label: t.video,
      Icon: Video,
      onSelect: onSelectVideo
    },
    {
      id: "image" as const,
      label: t.image,
      Icon: ImageIcon,
      onSelect: onSelectImage
    },
    {
      id: "audio" as const,
      label: t.audio,
      Icon: Music2,
      onSelect: onSelectAudio
    }
  ];

  return (
    <>
      <div className={VIDEO_PANEL_KIND_GRID}>
        {items.map(({ id, label, Icon, onSelect }) => {
          const active = selectedSlot === id;

          return (
            <button
              key={id}
              ref={buttonRefs[id]}
              type="button"
              onClick={() => {
                onSelect();
                setOpenMenuSlot((current) => (current === id ? null : id));
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className={cn(videoPanelKindCardClass(active), "nodrag nopan pointer-events-auto")}
            >
              <Icon className={VIDEO_PANEL_KIND_ICON} />
              <span className={VIDEO_PANEL_KIND_TITLE}>{label}</span>
            </button>
          );
        })}
      </div>

      {openMenuSlot ? (
        <GenerationReferenceSourcePopover
          locale={locale}
          slot={openMenuSlot}
          open
          align={menuAlignBySlot[openMenuSlot]}
          anchorRef={buttonRefs[openMenuSlot]}
          onLocalUpload={() => onReferenceLocal(openMenuSlot)}
          onOpenLibrary={() => onReferenceLibrary(openMenuSlot)}
          onOpenCanvasPicker={() => onReferenceCanvas(openMenuSlot)}
          onClose={() => setOpenMenuSlot(null)}
        />
      ) : null}
    </>
  );
}
