"use client";

import { useEffect, useRef, useState } from "react";
import { Music2, Video } from "lucide-react";
import type { CanvasLibraryAsset } from "@/lib/canvas/generation-ui";

export function GenerationAssetLibraryPreview({ asset }: { asset: CanvasLibraryAsset }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const isVideo = asset.mimeType.startsWith("video/");
  const isAudio = asset.mimeType.startsWith("audio/") || asset.assetType === "MUSIC";

  return (
    <div ref={rootRef} className="relative aspect-[4/3] bg-zinc-100">
      {!visible ? (
        <div className="flex h-full w-full items-center justify-center text-zinc-300">
          {isVideo ? <Video className="h-8 w-8" /> : isAudio ? <Music2 className="h-8 w-8" /> : null}
        </div>
      ) : isVideo ? (
        <video
          src={asset.url}
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      ) : isAudio ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-zinc-900 px-3 text-center">
          <Music2 className="h-7 w-7 text-violet-300" />
          <span className="line-clamp-2 text-[10px] text-white/70">{asset.fileName}</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.url}
          alt={asset.fileName}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
