"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { Maximize2, Minimize2, Play, Volume2, VolumeX } from "lucide-react";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { isChineseLanguage } from "@/lib/i18n";
import { resolveHomeHeroVideoSrc } from "@/lib/marketing/home-hero-video-sources";
import { cn } from "@/lib/utils";

type HeroVideoLabels = {
  video: string;
  soundOn: string;
  mute: string;
  soundOnAria: string;
  muteAria: string;
  fullscreen: string;
  exitFullscreen: string;
  seek: string;
};

const videoLabels: Record<MarketingLocale, HeroVideoLabels> = {
  en: {
    video: "VINCIS homepage promotional video",
    soundOn: "Sound on",
    mute: "Mute",
    soundOnAria: "Turn video sound on",
    muteAria: "Mute video",
    fullscreen: "Full screen",
    exitFullscreen: "Exit full screen",
    seek: "Seek video"
  },
  "zh-CN": {
    video: "VINCIS 首页宣传视频",
    soundOn: "开启声音",
    mute: "静音",
    soundOnAria: "开启视频声音",
    muteAria: "静音视频",
    fullscreen: "全屏",
    exitFullscreen: "退出全屏",
    seek: "拖动视频进度"
  },
  "zh-TW": {
    video: "VINCIS 首頁宣傳影片",
    soundOn: "開啟聲音",
    mute: "靜音",
    soundOnAria: "開啟影片聲音",
    muteAria: "將影片靜音",
    fullscreen: "全螢幕",
    exitFullscreen: "退出全螢幕",
    seek: "拖動影片進度"
  },
  ja: {
    video: "VINCIS ホームページ紹介動画",
    soundOn: "音声オン",
    mute: "ミュート",
    soundOnAria: "動画の音声をオンにする",
    muteAria: "動画をミュート",
    fullscreen: "全画面",
    exitFullscreen: "全画面解除",
    seek: "動画の再生位置"
  },
  ko: {
    video: "VINCIS 홈페이지 홍보 영상",
    soundOn: "소리 켜기",
    mute: "음소거",
    soundOnAria: "영상 소리 켜기",
    muteAria: "영상 음소거",
    fullscreen: "전체 화면",
    exitFullscreen: "전체 화면 종료",
    seek: "영상 재생 위치"
  },
  ms: {
    video: "Video promosi halaman utama VINCIS",
    soundOn: "Hidupkan bunyi",
    mute: "Senyap",
    soundOnAria: "Hidupkan bunyi video",
    muteAria: "Senyapkan video",
    fullscreen: "Skrin penuh",
    exitFullscreen: "Keluar skrin penuh",
    seek: "Cari kedudukan video"
  },
  km: {
    video: "វីដេអូផ្សព្វផ្សាយទំព័រដើម VINCIS",
    soundOn: "បើកសំឡេង",
    mute: "បិទសំឡេង",
    soundOnAria: "បើកសំឡេងវីដេអូ",
    muteAria: "បិទសំឡេងវីដេអូ",
    fullscreen: "ពេញអេក្រង់",
    exitFullscreen: "ចេញពីពេញអេក្រង់",
    seek: "រកមើលទីតាំងវីដេអូ"
  },
  th: {
    video: "วิดีโอโปรโมตหน้าแรก VINCIS",
    soundOn: "เปิดเสียง",
    mute: "ปิดเสียง",
    soundOnAria: "เปิดเสียงวิดีโอ",
    muteAria: "ปิดเสียงวิดีโอ",
    fullscreen: "เต็มจอ",
    exitFullscreen: "ออกจากเต็มจอ",
    seek: "เลื่อนตำแหน่งวิดีโอ"
  },
  vi: {
    video: "Video giới thiệu trang chủ VINCIS",
    soundOn: "Bật âm thanh",
    mute: "Tắt tiếng",
    soundOnAria: "Bật âm thanh video",
    muteAria: "Tắt tiếng video",
    fullscreen: "Toàn màn hình",
    exitFullscreen: "Thoát toàn màn hình",
    seek: "Tua video"
  },
  fr: {
    video: "Vidéo promotionnelle de la page d'accueil VINCIS",
    soundOn: "Activer le son",
    mute: "Muet",
    soundOnAria: "Activer le son de la vidéo",
    muteAria: "Couper le son de la vidéo",
    fullscreen: "Plein écran",
    exitFullscreen: "Quitter le plein écran",
    seek: "Position de la vidéo"
  },
  es: {
    video: "Vídeo promocional de la página de inicio de VINCIS",
    soundOn: "Activar sonido",
    mute: "Silenciar",
    soundOnAria: "Activar el sonido del vídeo",
    muteAria: "Silenciar el vídeo",
    fullscreen: "Pantalla completa",
    exitFullscreen: "Salir de pantalla completa",
    seek: "Posición del vídeo"
  }
};

function formatVideoTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function HomeHeroVideo({
  locale,
  videoSrc: videoSrcProp
}: {
  locale: Locale | MarketingLocale;
  videoSrc?: string;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointerTypeRef = useRef<PointerEvent["pointerType"] | null>(null);
  const [muted, setMuted] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchControlsVisible, setTouchControlsVisible] = useState(false);
  const videoLocale: MarketingLocale = locale === "zh" ? "zh-CN" : (locale as MarketingLocale);
  const labels = videoLabels[videoLocale] ?? videoLabels.en;
  const videoSrc = videoSrcProp ?? resolveHomeHeroVideoSrc(videoLocale);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncDuration = () => {
      if (Number.isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };
    const syncProgress = () => setProgress(video.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ??
        (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
        null;
      const nextFullscreen = fullscreenElement === shellRef.current;
      setIsFullscreen(nextFullscreen);
      if (!nextFullscreen) {
        setTouchControlsVisible(false);
        clearHideControlsTimer();
      }
    };

    syncDuration();
    syncProgress();
    setIsPlaying(!video.paused);
    void video.play().catch(() => setIsPlaying(false));
    video.addEventListener("loadedmetadata", syncDuration);
    video.addEventListener("durationchange", syncDuration);
    video.addEventListener("timeupdate", syncProgress);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);

    return () => {
      video.removeEventListener("loadedmetadata", syncDuration);
      video.removeEventListener("durationchange", syncDuration);
      video.removeEventListener("timeupdate", syncProgress);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, [videoSrc]);

  useEffect(() => {
    setHasVideoError(false);
  }, [videoSrc]);

  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  function clearHideControlsTimer() {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  }

  function showTouchControls(autoHideMs = 3500) {
    setTouchControlsVisible(true);
    clearHideControlsTimer();
    if (autoHideMs > 0) {
      hideControlsTimerRef.current = setTimeout(() => {
        setTouchControlsVisible(false);
      }, autoHideMs);
    }
  }

  function keepTouchControlsVisible() {
    showTouchControls(3500);
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !muted;
    video.muted = nextMuted;
    if (!nextMuted) {
      video.volume = 1;
      if (!video.paused) {
        void video.play().catch(() => undefined);
      }
    }
    setMuted(nextMuted);
  }

  function handleSeek(nextTime: number) {
    const video = videoRef.current;
    if (!video || !Number.isFinite(nextTime)) return;
    video.currentTime = nextTime;
    setProgress(nextTime);
  }

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setIsPlaying(true);
      void video.play().catch(() => {
        setIsPlaying(false);
      });
      return;
    }
    video.pause();
    setIsPlaying(false);
  }

  function toggleFullscreen() {
    const shell = shellRef.current;
    const video = videoRef.current;
    if (!shell || !video) return;

    if (document.fullscreenElement === shell) {
      void document.exitFullscreen();
      return;
    }

    if (shell.requestFullscreen) {
      void shell.requestFullscreen();
      return;
    }

    const iosVideo = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    iosVideo.webkitEnterFullscreen?.();
  }

  function isTouchPointer() {
    return lastPointerTypeRef.current === "touch";
  }

  function handleShellClick(event: MouseEvent<HTMLDivElement>) {
    if (hasVideoError) return;
    const target = event.target as HTMLElement;
    if (
      target.closest(
        ".home-hero-video-mute-btn, .home-hero-video-fullscreen-btn, .home-hero-video-bottom, .home-hero-video-range"
      )
    ) {
      return;
    }

    if (isTouchPointer() && !touchControlsVisible) {
      showTouchControls();
      lastPointerTypeRef.current = null;
      return;
    }

    togglePlayback();
  }

  function handleShellPointerDown(event: PointerEvent<HTMLDivElement>) {
    lastPointerTypeRef.current = event.pointerType;
    if (event.pointerType !== "touch") return;
    const target = event.target as HTMLElement;
    if (
      target.closest(
        ".home-hero-video-mute-btn, .home-hero-video-fullscreen-btn, .home-hero-video-bottom, .home-hero-video-range"
      )
    ) {
      keepTouchControlsVisible();
    }
  }

  const pauseAriaLabel = isChineseLanguage(videoLocale) ? "暂停视频" : "Pause video";

  return (
    <section className="bg-black px-0 py-0 lg:px-8 lg:py-0">
      <div
        ref={shellRef}
        onClick={handleShellClick}
        onPointerDown={handleShellPointerDown}
        aria-label={!hasVideoError && isPlaying ? pauseAriaLabel : undefined}
        className={cn(
          "home-hero-video-shell group relative w-full cursor-pointer touch-manipulation overflow-hidden rounded-none bg-black shadow-none lg:mx-auto lg:max-w-[1216px] lg:shadow-[0_28px_90px_-64px_rgba(0,0,0,0.55)]",
          isFullscreen && "flex max-w-none items-center justify-center",
          touchControlsVisible && "home-hero-video-controls-visible"
        )}
      >
        <video
          key={videoSrc}
          ref={videoRef}
          src={videoSrc}
          className={cn(
            "home-hero-video-player relative z-0 w-full cursor-pointer",
            isFullscreen
              ? "h-auto max-h-full w-auto max-w-full shrink-0 object-contain object-center"
              : "aspect-[21/9] object-cover"
          )}
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="auto"
          aria-label={labels.video}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedData={() => {
            void videoRef.current?.play().catch(() => setIsPlaying(false));
          }}
          onCanPlay={() => setHasVideoError(false)}
          onError={() => setHasVideoError(true)}
        />
        {!hasVideoError && !isPlaying ? (
          <div
            className="home-hero-video-center-btn pointer-events-none absolute left-1/2 top-1/2 z-[8] inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md sm:h-11 sm:w-11"
            aria-hidden
          >
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </div>
        ) : null}
        {!hasVideoError ? (
          <div className="home-hero-video-controls absolute inset-0 z-20">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleSound();
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
                keepTouchControlsVisible();
              }}
              className="home-hero-video-mute-btn absolute left-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-4 sm:top-4 sm:h-10 sm:w-10"
              aria-pressed={!muted}
              aria-label={muted ? labels.soundOnAria : labels.muteAria}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleFullscreen();
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
                keepTouchControlsVisible();
              }}
              className="home-hero-video-fullscreen-btn absolute right-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
              aria-label={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <div
              className="home-hero-video-bottom absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pb-3 pt-6 sm:px-4 sm:pb-3.5"
              onPointerDown={(event) => {
                event.stopPropagation();
                keepTouchControlsVisible();
              }}
            >
              <span className="mb-1 block text-[11px] font-medium tabular-nums text-white sm:text-xs">
                {formatVideoTime(progress)} / {formatVideoTime(duration)}
              </span>
              <label className="sr-only" htmlFor={`hero-video-seek-${videoLocale}`}>
                {labels.seek}
              </label>
              <input
                id={`hero-video-seek-${videoLocale}`}
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(progress, duration || 0)}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  keepTouchControlsVisible();
                }}
                onChange={(event) => {
                  event.stopPropagation();
                  handleSeek(Number(event.target.value));
                }}
                style={
                  {
                    "--hero-video-progress": duration
                      ? `${(Math.min(progress, duration) / duration) * 100}%`
                      : "0%"
                  } as CSSProperties
                }
                className="home-hero-video-range h-1 w-full cursor-pointer appearance-none rounded-sm"
                aria-label={labels.seek}
                aria-valuemin={0}
                aria-valuemax={duration || 0}
                aria-valuenow={progress}
              />
            </div>
          </div>
        ) : null}
        {hasVideoError ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-zinc-950 px-6 text-center">
            <p className="text-sm text-zinc-300">
              {isChineseLanguage(videoLocale) ? "视频暂时无法播放" : "Video is temporarily unavailable"}
            </p>
            <button
              type="button"
              className="rounded-full border border-white/20 px-4 py-1.5 text-xs text-white transition hover:bg-white/10"
              onClick={(event) => {
                event.stopPropagation();
                const video = videoRef.current;
                if (!video) return;
                setHasVideoError(false);
                video.load();
                void video.play().catch(() => setHasVideoError(true));
              }}
            >
              {isChineseLanguage(videoLocale) ? "重试" : "Retry"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
