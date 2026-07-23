"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { formatAudioTime } from "@/lib/canvas/music-node-design";
import { cn } from "@/lib/utils";

export function MusicNodeAudioPlayer({
  url,
  variant = "default"
}: {
  url: string;
  variant?: "default" | "ready";
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const ready = variant === "ready";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [url]);

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [url]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    audio.muted = next;
    setMuted(next);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5">
      <audio ref={audioRef} src={url} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "nodrag nopan inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white",
          ready ? "border border-[#C4B5FD]" : "shadow-sm ring-1 ring-violet-100"
        )}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <Pause className="h-4 w-4 text-[#8B5CF6]" />
        ) : (
          <Play className="ml-0.5 h-4 w-4 fill-[#8B5CF6] text-[#8B5CF6]" />
        )}
      </button>
      <span className="w-9 shrink-0 text-[11px] tabular-nums text-zinc-500">
        {formatAudioTime(currentTime)}
      </span>
      <div className="relative min-w-0 flex-1 py-1">
        <div className={cn("h-1 rounded-full", ready ? "bg-[#E9E3FF]" : "bg-violet-200/80")}>
          {!ready ? (
            <div
              className="h-full rounded-full bg-[#8B5CF6] transition-[width]"
              style={{ width: `${progress}%` }}
            />
          ) : null}
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(event) => seek(Number(event.target.value))}
          className="nodrag nopan absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Seek"
        />
        <span
          className={cn(
            "pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white",
            ready ? "ring-2 ring-[#8B5CF6]" : "ring-2 ring-[#8B5CF6]"
          )}
          style={{ left: `calc(${progress}% - 7px)` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-zinc-500">
        {formatAudioTime(duration)}
      </span>
      <button
        type="button"
        onClick={toggleMute}
        className="nodrag nopan inline-flex h-5 w-5 shrink-0 items-center justify-center text-[#8B5CF6]"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        <Volume2 className="h-4 w-4" />
      </button>
    </div>
  );
}
