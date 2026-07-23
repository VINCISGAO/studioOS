"use client";

import { MUSIC_NODE_LOADING_UI, MUSIC_WAVEFORM_BARS } from "@/lib/canvas/music-node-design";

function LoadingSparkle({ className }: { className: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className={className}
      fill="currentColor"
    >
      <path d="M6 0L6.8 4.6L11.5 5.4L6.8 6.2L6 11L5.2 6.2L0.5 5.4L5.2 4.6L6 0Z" />
    </svg>
  );
}

export function MusicNodeWaveformArt() {
  return (
    <div className={MUSIC_NODE_LOADING_UI.waveformWrap}>
      <LoadingSparkle className="absolute left-3 top-1 h-3 w-3 text-[#C4B5FD]" />
      <LoadingSparkle className="absolute bottom-2 left-8 h-2.5 w-2.5 text-[#DDD6FE]" />
      <LoadingSparkle className="absolute right-4 top-3 h-3 w-3 text-[#C4B5FD]" />
      {MUSIC_WAVEFORM_BARS.map((height, index) => (
        <span
          key={`bar-${index}`}
          className={MUSIC_NODE_LOADING_UI.waveformBar}
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}
