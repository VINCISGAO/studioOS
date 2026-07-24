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
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function VideoNodeReadyPlayer({
  data,
  selected,
  locale = "zh"
}: {
  data: CanvasNodeData;
  selected: boolean;
  locale?: Locale;
}) {
  const t = videoNodeReadyCopy[locale];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const metadata = readVideoNodeMetadata(data);
  const url = data.url ?? "";

  useEffect(() => {
    setDurationSec(0);
    return () => {
      videoRef.current?.pause();
    };
  }, [url]);

  function onLoadedMetadata() {
    const seconds = videoRef.current?.duration ?? 0;
    if (Number.isFinite(seconds) && seconds > 0) {
      setDurationSec(seconds);
    }
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => undefined);
      return;
    }
    video.pause();
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
          ref={videoRef}
          src={url}
          playsInline
          preload="metadata"
          className={VIDEO_NODE_READY_UI.video}
          onLoadedMetadata={onLoadedMetadata}
          onClick={togglePlay}
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
