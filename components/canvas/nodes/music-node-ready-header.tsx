"use client";

import { Music2 } from "lucide-react";
import { MUSIC_NODE_READY_UI, musicNodeCopy } from "@/lib/canvas/music-node-design";

export function MusicNodeReadyHeader({
  title,
  subtitle
}: {
  title: string;
  subtitle: string;
}) {
  const t = musicNodeCopy.zh;

  return (
    <div className="flex items-start gap-2.5">
      <span className={MUSIC_NODE_READY_UI.icon}>
        <Music2 className={MUSIC_NODE_READY_UI.iconGlyph} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className={MUSIC_NODE_READY_UI.title}>{title || t.title}</h3>
          <span className={MUSIC_NODE_READY_UI.badge}>
            <span className={MUSIC_NODE_READY_UI.badgeDot}>✓</span>
            {t.readyBadge}
          </span>
        </div>
        <p className={MUSIC_NODE_READY_UI.subtitle}>{subtitle}</p>
      </div>
    </div>
  );
}
