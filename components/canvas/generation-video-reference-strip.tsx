"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, ImageIcon, Music2, Video, X } from "lucide-react";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import { GenerationReferenceSourcePopover } from "@/components/canvas/generation-reference-source-popover";
import type { GenerationReference } from "@/lib/canvas/generation-ui";
import {
  VIDEO_PANEL_KIND_TILE,
  VIDEO_PANEL_REFERENCE_FADE,
  VIDEO_PANEL_REFERENCE_ROW,
  VIDEO_PANEL_REFERENCE_SCROLL_BUTTON,
  VIDEO_PANEL_REFERENCE_SCROLLER
} from "@/lib/canvas/generation-video-panel-design";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: { video: "视频", image: "图片", audio: "音频", scrollNext: "查看更多素材" },
  en: { video: "Video", image: "Image", audio: "Audio", scrollNext: "Scroll for more assets" }
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
    <div className="group relative shrink-0">
      <div
        className={cn(
          VIDEO_PANEL_KIND_TILE,
          "overflow-hidden border bg-zinc-100 transition",
          selected
            ? "border-zinc-900 bg-white ring-2 ring-zinc-900/10 shadow-sm"
            : "border-zinc-200 hover:border-zinc-300"
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
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className={cn(
          "absolute left-1 top-1 z-10 rounded-full bg-zinc-900/90 p-0.5 text-white shadow-sm transition-opacity",
          "opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        )}
        aria-label="Remove reference"
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
  const [canScrollRight, setCanScrollRight] = useState(false);
  const canScrollRightRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const syncScrollState = () => {
      const next = node.scrollLeft + node.clientWidth < node.scrollWidth - 4;
      if (next === canScrollRightRef.current) return;
      canScrollRightRef.current = next;
      setCanScrollRight(next);
    };

    syncScrollState();
    node.addEventListener("scroll", syncScrollState, { passive: true });
    const observer = new ResizeObserver(syncScrollState);
    observer.observe(node);

    return () => {
      node.removeEventListener("scroll", syncScrollState);
      observer.disconnect();
    };
  }, [librarySelections.length, visibleSlots.length]);

  const items = [
    { id: "video" as const, label: t.video, Icon: Video, onSelect: onSelectVideo },
    { id: "image" as const, label: t.image, Icon: ImageIcon, onSelect: onSelectImage },
    { id: "audio" as const, label: t.audio, Icon: Music2, onSelect: onSelectAudio }
  ].filter((item) => visibleSlots.includes(item.id));

  return (
    <>
      <div className={VIDEO_PANEL_REFERENCE_ROW}>
        <div ref={scrollRef} className={VIDEO_PANEL_REFERENCE_SCROLLER}>
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
                  VIDEO_PANEL_KIND_TILE,
                  "flex flex-col items-center justify-center gap-1 border transition nodrag nopan pointer-events-auto",
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
                className="nodrag nopan pointer-events-auto shrink-0 cursor-pointer"
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

        {canScrollRight ? (
          <>
            <div className={VIDEO_PANEL_REFERENCE_FADE} aria-hidden />
            <button
              type="button"
              aria-label={t.scrollNext}
              onClick={() => scrollRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
              onPointerDown={(event) => event.stopPropagation()}
              className={VIDEO_PANEL_REFERENCE_SCROLL_BUTTON}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        ) : null}
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
