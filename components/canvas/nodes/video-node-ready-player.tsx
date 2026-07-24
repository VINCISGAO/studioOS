"use client";

import { useEffect, useRef, useState } from "react";
import { Info, Maximize2 } from "lucide-react";
import { NodeResizer } from "@xyflow/react";
import type { CanvasNodeData } from "@/lib/canvas/types";
import { VideoNodeInfoDialog } from "@/components/canvas/nodes/video-node-info-dialog";
import {
  formatVideoDuration,
  readVideoNodeMetadata
} from "@/lib/canvas/video-node-metadata";
import {
  VIDEO_NODE_READY_UI,
  videoNodeReadyCopy
} from "@/lib/canvas/video-node-ready-design";
import {
  attachVideoFirstFramePreview,
  resolveVideoFirstFrameSeekSec
} from "@/lib/canvas/video-first-frame-preview";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function VideoNodeReadyPlayer({
  data,
  selected,
  locale = "zh",
  onVideoDimensions
}: {
  data: CanvasNodeData;
  selected: boolean;
  locale?: Locale;
  onVideoDimensions?: (width: number, height: number) => void;
}) {
  const t = videoNodeReadyCopy[locale];
  const videoRef = useRef<HTMLVideoElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const metadata = readVideoNodeMetadata(data);
  const url = data.url ?? "";

  useEffect(() => {
    setDurationSec(0);
    const video = videoRef.current;
    if (!video || !url) return;

    video.muted = true;
    const detach = attachVideoFirstFramePreview(video, () => {
      const seconds = video.duration ?? 0;
      if (Number.isFinite(seconds) && seconds > 0) {
        setDurationSec(seconds);
      }
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        onVideoDimensions?.(video.videoWidth, video.videoHeight);
      }
    });

    return () => {
      detach();
      video.pause();
    };
  }, [url, onVideoDimensions]);

  function onLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;
    const seconds = video.duration ?? 0;
    if (Number.isFinite(seconds) && seconds > 0) {
      setDurationSec(seconds);
    }
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (video.currentTime <= resolveVideoFirstFrameSeekSec(video.duration)) {
        video.currentTime = 0;
      }
      video.muted = false;
      void video.play().catch(() => undefined);
      return;
    }
    video.pause();
  }

  function handleVideoPointerDown(event: React.PointerEvent<HTMLVideoElement>) {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function handleVideoClick(event: React.MouseEvent<HTMLVideoElement>) {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (start) {
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (dx * dx + dy * dy > 64) return;
    }
    togglePlay();
  }

  function openFullscreen() {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      void video.requestFullscreen();
      return;
    }
    const legacy = video as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };
    legacy.webkitEnterFullscreen?.();
  }

  const fallbackDurationSec = Number.parseInt(metadata.durationLabel, 10);
  const durationLabel =
    durationSec > 0
      ? formatVideoDuration(durationSec)
      : Number.isFinite(fallbackDurationSec) && fallbackDurationSec > 0
        ? formatVideoDuration(fallbackDurationSec)
        : "00:00";

  return (
    <>
      <div
        className={cn(
          VIDEO_NODE_READY_UI.shell,
          selected ? VIDEO_NODE_READY_UI.shellSelected : VIDEO_NODE_READY_UI.shellDefault
        )}
      >
        <NodeResizer
          isVisible={selected}
          minWidth={280}
          minHeight={180}
          lineClassName="canvas-video-resizer !border-blue-500"
          handleClassName="canvas-video-resizer !h-2 !w-2 !border-blue-500 !bg-white"
        />

        <video
          key={url}
          ref={videoRef}
          src={url}
          muted
          playsInline
          preload="auto"
          draggable={false}
          className={VIDEO_NODE_READY_UI.video}
          onLoadedMetadata={onLoadedMetadata}
          onPointerDown={handleVideoPointerDown}
          onClick={handleVideoClick}
        />

        <button
          type="button"
          className={cn(VIDEO_NODE_READY_UI.overlayButton, VIDEO_NODE_READY_UI.infoButton)}
          aria-label={t.info}
          onClick={() => setInfoOpen(true)}
        >
          <Info className="h-3.5 w-3.5" />
        </button>

        <span
          className={cn(VIDEO_NODE_READY_UI.overlayButton, VIDEO_NODE_READY_UI.durationBadge)}
        >
          {durationLabel}
        </span>

        <button
          type="button"
          className={cn(VIDEO_NODE_READY_UI.overlayButton, VIDEO_NODE_READY_UI.expandButton)}
          aria-label={t.expand}
          onClick={openFullscreen}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <VideoNodeInfoDialog
        locale={locale}
        open={infoOpen}
        previewUrl={url}
        metadata={metadata}
        onClose={() => setInfoOpen(false)}
      />
    </>
  );
}
