"use client";

import { Maximize2, Play, EyeOff, Trash2, Eye } from "lucide-react";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { WorkVideoPlayer } from "@/components/creator/work-video-player";
import { canEmbedVideo, resolveWorkThumbnail, sanitizeVideoUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";

type WorkGridTileProps = {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  platform?: string;
  isActive?: boolean;
  isHidden?: boolean;
  ownerActions?: {
    onHide?: () => void;
    onShow?: () => void;
    onDelete?: () => void;
    hideLabel: string;
    showLabel: string;
    deleteLabel: string;
    hiddenLabel: string;
  };
  onActivate: () => void;
  onExpand?: () => void;
  className?: string;
};

export function WorkGridTile({
  videoUrl,
  thumbnailUrl,
  title,
  platform,
  isActive = false,
  isHidden = false,
  ownerActions,
  onActivate,
  onExpand,
  className
}: WorkGridTileProps) {
  const cleanUrl = sanitizeVideoUrl(videoUrl);
  const poster = resolveWorkThumbnail(videoUrl, thumbnailUrl);
  const playable = canEmbedVideo(cleanUrl);

  const ownerBar = ownerActions ? (
    <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2">
      {isHidden ? (
        <span className="rounded-full bg-zinc-900/75 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
          {ownerActions.hiddenLabel}
        </span>
      ) : (
        <span />
      )}
      <div className="ml-auto flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        {isHidden ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              ownerActions.onShow?.();
            }}
            className="rounded-full bg-white/95 p-2 text-zinc-700 shadow-sm transition hover:bg-white"
            aria-label={ownerActions.showLabel}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              ownerActions.onHide?.();
            }}
            className="rounded-full bg-white/95 p-2 text-zinc-700 shadow-sm transition hover:bg-white"
            aria-label={ownerActions.hideLabel}
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            ownerActions.onDelete?.();
          }}
          className="rounded-full bg-white/95 p-2 text-red-600 shadow-sm transition hover:bg-white"
          aria-label={ownerActions.deleteLabel}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  ) : null;

  if (isActive && playable) {
    return (
      <div
        className={cn(
          "group relative aspect-[9/16] w-full overflow-hidden bg-black",
          isHidden && "opacity-80 ring-2 ring-zinc-400/50",
          className
        )}
        aria-label={title}
      >
        {ownerBar}
        <WorkVideoPlayer videoUrl={videoUrl} thumbnailUrl={thumbnailUrl} title={title} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pb-3 pt-12">
          <p className="truncate text-sm font-medium text-white">{title}</p>
          {platform ? <p className="mt-0.5 truncate text-xs text-white/70">{platform}</p> : null}
        </div>
        {onExpand ? (
          <button
            type="button"
            onClick={onExpand}
            className="absolute right-2.5 top-2.5 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
            aria-label={title}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onActivate}
      className={cn(
        "group relative aspect-[9/16] w-full overflow-hidden bg-zinc-100",
        isHidden && "opacity-75 ring-2 ring-dashed ring-zinc-300",
        className
      )}
      aria-label={title}
    >
      {ownerBar}
      {poster ? (
        <WorkCoverImage
          src={poster}
          alt={title}
          className="transition duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-200 px-3 text-center">
          <Play className="h-9 w-9 text-zinc-500" />
          <span className="text-xs text-zinc-500">{platform ?? "Video"}</span>
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20" />

      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-lg">
          <Play className="h-6 w-6 fill-current" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-3 pb-3 pt-10">
        <p className="truncate text-left text-sm font-medium text-white">{title}</p>
        {platform ? <p className="mt-0.5 truncate text-left text-xs text-white/70">{platform}</p> : null}
      </div>
    </button>
  );
}
