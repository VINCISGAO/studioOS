"use client";

import type { ReactNode } from "react";
import { Music2 } from "lucide-react";
import type { CanvasNodeData } from "@/lib/canvas/types";
import { MusicNodeWaveformArt } from "@/components/canvas/nodes/music-node-waveform-art";
import {
  MUSIC_NODE_LOADING_UI,
  MUSIC_NODE_READY_UI,
  musicNodeCopy,
  normalizeMusicNodeProgress
} from "@/lib/canvas/music-node-design";
import { cn } from "@/lib/utils";

function MusicIconBadge({ ready = false, compact = false }: { ready?: boolean; compact?: boolean }) {
  if (ready) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-violet-500 to-indigo-500 shadow-sm",
          compact ? "h-9 w-9" : "h-10 w-10"
        )}
      >
        <Music2
          className={cn(
            "text-white",
            ready && compact ? "h-4 w-4" : "h-5 w-5"
          )}
        />
      </span>
    );
  }

  return (
    <span className={MUSIC_NODE_LOADING_UI.icon}>
      <Music2 className={MUSIC_NODE_LOADING_UI.iconGlyph} />
    </span>
  );
}

export function MusicNodeHeader({
  ready = false,
  compact = false,
  title,
  subtitle,
  trailing
}: {
  ready?: boolean;
  compact?: boolean;
  title: string;
  subtitle: string;
  trailing?: ReactNode;
}) {
  const t = musicNodeCopy.zh;

  return (
    <div className="flex items-start justify-between gap-2">
      <div className={cn("flex min-w-0 items-start", compact ? "gap-2.5" : "gap-3")}>
        <MusicIconBadge ready={ready} compact={compact} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3
              className={cn(
                "font-semibold text-zinc-900",
                compact ? "text-[14px] leading-5" : "text-[15px]"
              )}
            >
              {title || t.title}
            </h3>
            {ready ? (
              <span className={MUSIC_NODE_READY_UI.badge}>
                <span className={MUSIC_NODE_READY_UI.badgeDot}>✓</span>
                {t.readyBadge}
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              "text-zinc-400",
              compact ? "text-[10px] leading-3.5" : "mt-0.5 text-[12px] leading-4"
            )}
          >
            {subtitle}
          </p>
        </div>
      </div>
      {trailing}
    </div>
  );
}

export function MusicNodeGeneratingView({ data }: { data: CanvasNodeData }) {
  const t = musicNodeCopy.zh;
  const progress = normalizeMusicNodeProgress(data.progress);

  return (
    <>
      <div className={MUSIC_NODE_LOADING_UI.headerRow}>
        <div className={MUSIC_NODE_LOADING_UI.headerMain}>
          <span className={MUSIC_NODE_LOADING_UI.icon}>
            <Music2 className={MUSIC_NODE_LOADING_UI.iconGlyph} />
          </span>
          <div className="min-w-0">
            <h3 className={MUSIC_NODE_LOADING_UI.title}>{data.title || t.title}</h3>
            <p className={MUSIC_NODE_LOADING_UI.subtitle}>{t.generatingSubtitle}</p>
          </div>
        </div>
        <span className={MUSIC_NODE_LOADING_UI.statusWrap}>
          <span className={MUSIC_NODE_LOADING_UI.statusDot} />
          <span className={MUSIC_NODE_LOADING_UI.statusText}>{t.generatingStatus}</span>
        </span>
      </div>
      <div className={MUSIC_NODE_LOADING_UI.panel}>
        <MusicNodeWaveformArt />
        <div className={MUSIC_NODE_LOADING_UI.progressTrack}>
          <div
            className={MUSIC_NODE_LOADING_UI.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={MUSIC_NODE_LOADING_UI.progressLabel}>{t.generatingProgress(progress)}</p>
        <p className={MUSIC_NODE_LOADING_UI.hint}>{t.generatingHint}</p>
      </div>
    </>
  );
}
