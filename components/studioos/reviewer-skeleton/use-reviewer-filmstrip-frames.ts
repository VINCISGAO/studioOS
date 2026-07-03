"use client";

import { useEffect, useState } from "react";
import {
  captureReviewFilmstripFrames,
  frameTimeSec
} from "@/lib/studioos/review-filmstrip-frames";

export function useReviewerFilmstripFrames(
  videoUrl: string,
  durationSec: number,
  playbackVersion: number,
  frameCount: number
) {
  const [frames, setFrames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!videoUrl || durationSec <= 0) {
      setFrames([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    captureReviewFilmstripFrames(videoUrl, durationSec, frameCount)
      .then((nextFrames) => {
        if (cancelled) return;
        setFrames(nextFrames);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFrames([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [videoUrl, durationSec, playbackVersion, frameCount]);

  return { frames, loading, frameTimeSec: (index: number) => frameTimeSec(index, frameCount, durationSec) };
}
