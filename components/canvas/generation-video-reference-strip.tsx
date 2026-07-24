"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImageIcon, Music2, Video, X } from "lucide-react";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import { GenerationReferenceSourcePopover } from "@/components/canvas/generation-reference-source-popover";
import type { GenerationReference } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: { video: "视频", image: "图片", audio: "音频" },
  en: { video: "Video", image: "Image", audio: "Audio" }
} as const;

const menuAlignBySlot = {
  video: "start",
  image: "center",
  audio: "end"
} as const;

function ReferenceThumb({
  reference,
  selected,
  onRemove
}: {
  reference: GenerationReference;
  selected: boolean;
  onRemove: () => void;
}) {
  const isVideo = reference.mimeType?.startsWith("video/");
  const isAudio =
    reference.mimeType?.startsWith("audio/") || reference.fileName.toLowerCase().endsWith(".mp3");

  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "h-14 w-14 overflow-hidden rounded-xl border bg-zinc-100",
          selected ? "border-zinc-900 ring-2 ring-zinc-900/10" : "border-zinc-200"
        )}
        title={reference.fileName}
      >
        {isVideo ? (
          <video
            src={reference.url}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : isAudio ? (
          <div className="flex h-full items-center justify-center bg-zinc-900">
            <Music2 className="h-4 w-4 text-violet-300" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reference.url} alt={reference.fileName} className="h-full w-full object-cover" />
        )}
      </div>
      {selected ? (
        <span className="pointer-events-none absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-sm bg-zinc-900 text-white">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      ) : null}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="absolute -right-1 -top-1 rounded-full bg-zinc-900 p-0.5 text-white"
        aria-label="Remove"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

export function GenerationVideoReferenceStrip({
  locale,
  selectedSlot,
  librarySelections,
  activeReferenceId,
  visibleSlots = ["video", "image", "audio"],
  onSelectVideo,
  onSelectImage,
  onSelectAudio,
  onReferenceLocal,
  onReferenceLibrary,
  onReferenceCanvas,
  onActivateSelection,
  onRemoveSelection
}: {
  locale: Locale;
  selectedSlot: GenerationReferenceSlot;
  librarySelections: GenerationReference[];
  activeReferenceId?: string;
  visibleSlots?: readonly GenerationReferenceSlot[];
  onSelectVideo: () => void;
  onSelectImage: () => void;
  onSelectAudio: () => void;
  onReferenceLocal: (slot: GenerationReferenceSlot) => void;
  onReferenceLibrary: (slot: GenerationReferenceSlot) => void;
  onReferenceCanvas: (slot: GenerationReferenceSlot) => void;
  onActivateSelection: (reference: GenerationReference) => void;
  onRemoveSelection: (assetId: string) => void;
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
    { id: "video" as const, label: t.video, Icon: Video, onSelect: onSelectVideo },
    { id: "image" as const, label: t.image, Icon: ImageIcon, onSelect: onSelectImage },
    { id: "audio" as const, label: t.audio, Icon: Music2, onSelect: onSelectAudio }
  ].filter((item) => visibleSlots.includes(item.id));

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
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
              className={cn(
                "flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border transition nodrag nopan pointer-events-auto",
                active
                  ? "border-zinc-300 bg-white text-zinc-900 shadow-sm"
                  : "border-zinc-200/80 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:bg-white"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}

        {librarySelections.map((reference) => {
          const assetId = reference.assetId ?? reference.url;
          return (
            <div
              key={assetId}
              role="button"
              tabIndex={0}
              onClick={() => onActivateSelection(reference)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onActivateSelection(reference);
                }
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className="nodrag nopan pointer-events-auto cursor-pointer"
            >
              <ReferenceThumb
                reference={reference}
                selected={activeReferenceId === assetId}
                onRemove={() => onRemoveSelection(assetId)}
              />
            </div>
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
