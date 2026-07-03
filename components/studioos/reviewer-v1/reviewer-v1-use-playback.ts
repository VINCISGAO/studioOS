"use client";

import { useCallback, useEffect, useState } from "react";

export type ReviewerVideoStatus = "missing" | "loading" | "ready" | "error";

function readDuration(video: HTMLVideoElement | null) {
  if (!video) return 0;
  const duration = video.duration;
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
}

export function useReviewerPlayback(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  videoUrl: string,
  activeVersion: number
) {
  const [videoStatus, setVideoStatus] = useState<ReviewerVideoStatus>(videoUrl ? "loading" : "missing");
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    setVideoStatus(videoUrl ? "loading" : "missing");
    setDurationSec(0);
    setCurrentSec(0);
    setIsPlaying(false);
  }, [activeVersion, videoUrl]);

  useEffect(() => {
    if (!videoUrl) return;
    const timer = window.setTimeout(() => {
      setVideoStatus((current) => {
        if (current !== "loading") return current;
        setIsPlaying(false);
        return "error";
      });
    }, 30000);
    return () => window.clearTimeout(timer);
  }, [videoUrl, activeVersion]);

  const syncPlayingState = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(!video.paused && !video.ended);
  }, [videoRef]);

  const syncDuration = useCallback(() => {
    const duration = readDuration(videoRef.current);
    if (duration > 0) {
      setDurationSec(duration);
      setVideoStatus("ready");
    }
  }, [videoRef]);

  const handleLoadedMetadata = useCallback(() => {
    syncDuration();
    syncPlayingState();
  }, [syncDuration, syncPlayingState]);

  useEffect(() => {
    if (!videoUrl) return;
    const video = videoRef.current;
    if (!video) return;

    function syncVideoMetadata() {
      syncDuration();
      syncPlayingState();
    }

    const raf = window.requestAnimationFrame(syncVideoMetadata);
    video.addEventListener("loadedmetadata", syncVideoMetadata);
    video.addEventListener("loadeddata", syncVideoMetadata);
    video.addEventListener("durationchange", syncVideoMetadata);
    video.addEventListener("canplay", syncVideoMetadata);

    return () => {
      window.cancelAnimationFrame(raf);
      video.removeEventListener("loadedmetadata", syncVideoMetadata);
      video.removeEventListener("loadeddata", syncVideoMetadata);
      video.removeEventListener("durationchange", syncVideoMetadata);
      video.removeEventListener("canplay", syncVideoMetadata);
    };
  }, [videoRef, videoUrl, activeVersion, syncDuration, syncPlayingState]);

  const handleLoadedData = useCallback(() => {
    syncDuration();
    syncPlayingState();
  }, [syncDuration, syncPlayingState]);

  const handleDurationChange = useCallback(() => {
    syncDuration();
  }, [syncDuration]);

  const handleCanPlay = useCallback(() => {
    syncDuration();
    syncPlayingState();
  }, [syncDuration, syncPlayingState]);

  const handleError = useCallback(() => {
    setVideoStatus("error");
    setDurationSec(0);
    setIsPlaying(false);
  }, []);

  const handlePlay = useCallback(() => {
    syncPlayingState();
  }, [syncPlayingState]);

  const handlePause = useCallback(() => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.currentTime)) {
      setCurrentSec(video.currentTime);
    }
    setIsPlaying(false);
  }, [videoRef]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    setCurrentSec(videoRef.current?.currentTime ?? 0);
    const duration = readDuration(videoRef.current);
    if (duration > 0 && durationSec === 0) {
      setDurationSec(duration);
      setVideoStatus("ready");
    }
  }, [videoRef, durationSec]);

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video || !videoUrl || videoStatus === "error") return;
    if (video.paused) {
      void video.play().catch(() => {
        setIsPlaying(false);
        setVideoStatus("error");
      });
    } else {
      video.pause();
    }
  }, [videoRef, videoUrl, videoStatus]);

  const seekTo = useCallback(
    (sec: number) => {
      const next = Math.max(0, sec);
      setCurrentSec(next);
      if (videoRef.current) {
        videoRef.current.currentTime = next;
      }
    },
    [videoRef]
  );

  const pauseAt = useCallback(
    (sec: number) => {
      seekTo(sec);
      videoRef.current?.pause();
      setIsPlaying(false);
    },
    [seekTo, videoRef]
  );

  return {
    videoStatus,
    currentSec,
    durationSec,
    isPlaying,
    playbackRate,
    volume,
    setPlaybackRate,
    setVolume,
    handleLoadedMetadata,
    handleLoadedData,
    handleDurationChange,
    handleCanPlay,
    handleError,
    handlePlay,
    handlePause,
    handleEnded,
    handleTimeUpdate,
    handlePlayPause,
    seekTo,
    pauseAt
  };
}
