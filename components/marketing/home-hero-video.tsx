"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Maximize2, Minimize2, Play, Volume2, VolumeX } from "lucide-react";
import type { MarketingLocale } from "@/lib/i18n";
import { isChineseLanguage } from "@/lib/i18n";
import {
  acquireHomeHeroVideo,
  isHomeHeroVideoBuffered,
  releaseHomeHeroVideo
} from "@/lib/marketing/home-hero-video-pool";
import { cn } from "@/lib/utils";

const videoCopy: Record<
  MarketingLocale,
  {
    video: string;
    soundOnAria: string;
    muteAria: string;
    fullscreen: string;
    exitFullscreen: string;
    seek: string;
  }
> = {
  en: {
    video: "VINCIS homepage promotional video",
    soundOnAria: "Turn video sound on",
    muteAria: "Mute video",
    fullscreen: "Full screen",
    exitFullscreen: "Exit full screen",
    seek: "Seek video"
  },
  "zh-CN": {
    video: "VINCIS 首页宣传视频",
    soundOnAria: "开启视频声音",
    muteAria: "静音视频",
    fullscreen: "全屏",
    exitFullscreen: "退出全屏",
    seek: "拖动视频进度"
  },
  "zh-TW": {
    video: "VINCIS 首頁宣傳影片",
    soundOnAria: "開啟影片聲音",
    muteAria: "將影片靜音",
    fullscreen: "全螢幕",
    exitFullscreen: "退出全螢幕",
    seek: "拖動影片進度"
  },
  ja: {
    video: "VINCIS ホームページ紹介動画",
    soundOnAria: "動画の音声をオンにする",
    muteAria: "動画をミュート",
    fullscreen: "全画面",
    exitFullscreen: "全画面解除",
    seek: "動画の再生位置"
  },
  ko: {
    video: "VINCIS 홈페이지 홍보 영상",
    soundOnAria: "영상 소리 켜기",
    muteAria: "영상 음소거",
    fullscreen: "전체 화면",
    exitFullscreen: "전체 화면 종료",
    seek: "영상 재생 위치"
  },
  ms: {
    video: "Video promosi halaman utama VINCIS",
    soundOnAria: "Hidupkan bunyi video",
    muteAria: "Senyapkan video",
    fullscreen: "Skrin penuh",
    exitFullscreen: "Keluar skrin penuh",
    seek: "Cari kedudukan video"
  },
  km: {
    video: "វីដេអូផ្សព្វផ្សាយទំព័រដើម VINCIS",
    soundOnAria: "បើកសំឡេងវីដេអូ",
    muteAria: "បិទសំឡេងវីដេអូ",
    fullscreen: "ពេញអេក្រង់",
    exitFullscreen: "ចេញពីពេញអេក្រង់",
    seek: "រកមើលទីតាំងវីដេអូ"
  },
  th: {
    video: "วิดีโอโปรโมตหน้าแรก VINCIS",
    soundOnAria: "เปิดเสียงวิดีโอ",
    muteAria: "ปิดเสียงวิดีโอ",
    fullscreen: "เต็มจอ",
    exitFullscreen: "ออกจากเต็มจอ",
    seek: "เลื่อนตำแหน่งวิดีโอ"
  },
  vi: {
    video: "Video giới thiệu trang chủ VINCIS",
    soundOnAria: "Bật âm thanh video",
    muteAria: "Tắt tiếng video",
    fullscreen: "Toàn màn hình",
    exitFullscreen: "Thoát toàn màn hình",
    seek: "Tua video"
  },
  fr: {
    video: "Vidéo promotionnelle de la page d'accueil VINCIS",
    soundOnAria: "Activer le son de la vidéo",
    muteAria: "Couper le son de la vidéo",
    fullscreen: "Plein écran",
    exitFullscreen: "Quitter le plein écran",
    seek: "Avancer dans la vidéo"
  },
  es: {
    video: "Vídeo promocional de la página de inicio de VINCIS",
    soundOnAria: "Activar sonido del vídeo",
    muteAria: "Silenciar vídeo",
    fullscreen: "Pantalla completa",
    exitFullscreen: "Salir de pantalla completa",
    seek: "Buscar en el vídeo"
  }
};

function isAllowedVideoSrc(src: string) {
  return src.startsWith("/videos/") && !src.startsWith("//");
}

function isVideoRenderable(video: HTMLVideoElement) {
  return video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

type HomeHeroVideoProps = {
  locale: MarketingLocale;
  videoSrc: string;
  heroPosterSrc?: string;
};

export function HomeHeroVideo({ locale, videoSrc, heroPosterSrc }: HomeHeroVideoProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const videoMountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerTypeRef = useRef<string | null>(null);
  const seekId = useId().replace(/:/g, "");

  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [controlsActive, setControlsActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const markVideoReady = useCallback(() => {
    setFailed(false);
    setVideoReady(true);
  }, []);

  const copyLocale = locale;
  const labels = videoCopy[copyLocale] ?? videoCopy.en;
  const safeSrc = isAllowedVideoSrc(videoSrc) ? videoSrc : "";
  const zh = isChineseLanguage(copyLocale);
  const progress = duration > 0 ? (Math.min(currentTime, duration) / duration) * 100 : 0;

  const clearHideControlsTimeout = useCallback(() => {
    if (!hideControlsTimeoutRef.current) return;
    clearTimeout(hideControlsTimeoutRef.current);
    hideControlsTimeoutRef.current = null;
  }, []);

  const activateControls = useCallback(
    (autoHideMs = 3500) => {
      setControlsActive(true);
      clearHideControlsTimeout();
      if (autoHideMs > 0) {
        hideControlsTimeoutRef.current = setTimeout(() => {
          setControlsActive(false);
        }, autoHideMs);
      }
    },
    [clearHideControlsTimeout]
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setPlaying(true);
      void video.play().catch(() => setPlaying(false));
      return;
    }
    video.pause();
    setPlaying(false);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    if (!nextMuted) {
      video.volume = 1;
      if (video.paused) {
        void video.play().catch(() => {});
      }
    }
    setMuted(nextMuted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const shell = shellRef.current;
    const video = videoRef.current;
    if (!shell || !video) return;

    const fsElement =
      document.fullscreenElement ??
      (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
      null;

    if (fsElement === shell) {
      void document.exitFullscreen?.();
      return;
    }

    if (shell.requestFullscreen) {
      void shell.requestFullscreen();
      return;
    }

    const webkitVideo = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    webkitVideo.webkitEnterFullscreen?.();
  }, []);

  useEffect(() => {
    setFailed(false);
    setVideoReady(isHomeHeroVideoBuffered(safeSrc));
  }, [safeSrc]);

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const mount = videoMountRef.current;
    if (!mount || !safeSrc) return;

    const video = acquireHomeHeroVideo(safeSrc);
    videoRef.current = video;
    if (heroPosterSrc) {
      video.poster = heroPosterSrc;
    } else {
      video.removeAttribute("poster");
    }
    video.setAttribute("aria-label", labels.video);
    video.muted = muted;
    if (!muted) {
      video.volume = 1;
    }
    mount.appendChild(video);

    const syncDuration = () => {
      if (Number.isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };
    const syncCurrentTime = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime > 0 && !video.paused) {
        markVideoReady();
      }
    };
    const syncReady = () => {
      if (isVideoRenderable(video)) {
        markVideoReady();
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setFailed(true);
    const onFullscreenChange = () => {
      const fsElement =
        document.fullscreenElement ??
        (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
        null;
      const nextFullscreen = fsElement === shellRef.current;
      setIsFullscreen(nextFullscreen);
      if (!nextFullscreen) {
        setControlsActive(false);
        clearHideControlsTimeout();
      }
    };

    syncDuration();
    syncCurrentTime();
    syncReady();
    setPlaying(!video.paused);
    void video.play().catch(() => setPlaying(false));

    video.addEventListener("loadeddata", syncReady);
    video.addEventListener("canplay", syncReady);
    video.addEventListener("playing", syncReady);
    video.addEventListener("loadedmetadata", syncDuration);
    video.addEventListener("durationchange", syncDuration);
    video.addEventListener("timeupdate", syncCurrentTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onError);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);

    return () => {
      video.removeEventListener("loadeddata", syncReady);
      video.removeEventListener("canplay", syncReady);
      video.removeEventListener("playing", syncReady);
      video.removeEventListener("loadedmetadata", syncDuration);
      video.removeEventListener("durationchange", syncDuration);
      video.removeEventListener("timeupdate", syncCurrentTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onError);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      releaseHomeHeroVideo(video);
      videoRef.current = null;
    };
  }, [clearHideControlsTimeout, heroPosterSrc, labels.video, markVideoReady, muted, safeSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    if (!muted) {
      video.volume = 1;
    }
  }, [muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.className = cn(
      "home-hero-video-player relative z-0 w-full cursor-pointer transition-opacity duration-300",
      videoReady ? "opacity-100" : "opacity-0",
      isFullscreen
        ? "h-auto max-h-full w-auto max-w-full shrink-0 object-contain object-center"
        : "aspect-[21/9] object-cover"
    );
  }, [isFullscreen, videoReady]);

  if (!safeSrc) {
    return (
      <section className="bg-black px-0 py-0 lg:px-8 lg:py-0">
        <div
          className="relative mx-auto aspect-[21/9] w-full overflow-hidden rounded-none bg-[#050607] lg:mx-auto lg:max-w-[1216px] lg:rounded-lg lg:shadow-[0_28px_90px_-64px_rgba(0,0,0,0.55)]"
          style={
            heroPosterSrc
              ? {
                  backgroundImage: `url(${heroPosterSrc})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }
              : undefined
          }
        >
          <p className="absolute inset-x-0 bottom-4 text-center text-xs text-zinc-400">
            {zh ? "视频暂时无法播放" : "Video is temporarily unavailable"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-black px-0 py-0 lg:px-8 lg:py-0">
      <div
        ref={shellRef}
        className={cn(
          "home-hero-video-shell group relative w-full cursor-pointer touch-manipulation overflow-hidden rounded-none bg-black shadow-none lg:mx-auto lg:max-w-[1216px] lg:shadow-[0_28px_90px_-64px_rgba(0,0,0,0.55)]",
          isFullscreen && "flex max-w-none items-center justify-center",
          controlsActive && "home-hero-video-controls-visible"
        )}
        aria-label={!failed && playing ? (zh ? "暂停视频" : "Pause video") : undefined}
        onClick={(event) => {
          if (
            failed ||
            (event.target instanceof Element &&
              event.target.closest(
                ".home-hero-video-mute-btn, .home-hero-video-fullscreen-btn, .home-hero-video-bottom, .home-hero-video-range"
              ))
          ) {
            return;
          }

          if (pointerTypeRef.current === "touch" && !controlsActive) {
            activateControls();
            pointerTypeRef.current = null;
            return;
          }

          togglePlay();
        }}
        onPointerDown={(event) => {
          pointerTypeRef.current = event.pointerType;
          if (
            event.pointerType === "touch" &&
            event.target instanceof Element &&
            event.target.closest(
              ".home-hero-video-mute-btn, .home-hero-video-fullscreen-btn, .home-hero-video-bottom, .home-hero-video-range"
            )
          ) {
            activateControls();
          }
        }}
      >
        <div
          ref={videoMountRef}
          className={cn(
            "home-hero-video-player relative z-0 w-full",
            isFullscreen ? "flex max-h-full max-w-full shrink-0 items-center justify-center" : "aspect-[21/9]"
          )}
        />

        {!failed && !playing ? (
          <div
            className="home-hero-video-center-btn pointer-events-none absolute left-1/2 top-1/2 z-[8] inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md sm:h-11 sm:w-11"
            aria-hidden
          >
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </div>
        ) : null}

        {!failed ? (
          <div className="home-hero-video-controls absolute inset-0 z-20">
            <button
              type="button"
              className="home-hero-video-mute-btn absolute left-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-4 sm:top-4 sm:h-10 sm:w-10"
              aria-pressed={!muted}
              aria-label={muted ? labels.soundOnAria : labels.muteAria}
              onPointerDown={(event) => {
                event.stopPropagation();
                activateControls();
              }}
              onClick={(event) => {
                event.stopPropagation();
                toggleMute();
              }}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              className="home-hero-video-fullscreen-btn absolute right-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
              aria-label={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
              onPointerDown={(event) => {
                event.stopPropagation();
                activateControls();
              }}
              onClick={(event) => {
                event.stopPropagation();
                toggleFullscreen();
              }}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <div
              className="home-hero-video-bottom absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pb-3 pt-6 sm:px-4 sm:pb-3.5"
              onPointerDown={(event) => {
                event.stopPropagation();
                activateControls();
              }}
            >
              <span className="mb-1 block text-[11px] font-medium tabular-nums text-white sm:text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <label className="sr-only" htmlFor={`hero-video-seek-${seekId}`}>
                {labels.seek}
              </label>
              <input
                id={`hero-video-seek-${seekId}`}
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(currentTime, duration || 0)}
                aria-label={labels.seek}
                aria-valuemin={0}
                aria-valuemax={duration || 0}
                aria-valuenow={currentTime}
                className="home-hero-video-range h-1 w-full cursor-pointer appearance-none rounded-sm"
                style={{ "--hero-video-progress": `${progress}%` } as CSSProperties}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  activateControls();
                }}
                onChange={(event) => {
                  event.stopPropagation();
                  const nextTime = Number(event.currentTarget.value);
                  const video = videoRef.current;
                  if (!video || !Number.isFinite(nextTime)) return;
                  video.currentTime = nextTime;
                  setCurrentTime(nextTime);
                }}
              />
            </div>
          </div>
        ) : null}

        {failed ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-zinc-950 px-6 text-center">
            <p className="text-sm text-zinc-300">
              {zh ? "视频暂时无法播放" : "Video is temporarily unavailable"}
            </p>
            <button
              type="button"
              className="rounded-full border border-white/20 px-4 py-1.5 text-xs text-white transition hover:bg-white/10"
              onClick={(event) => {
                event.stopPropagation();
                const video = videoRef.current;
                if (!video) return;
                setFailed(false);
                video.load();
                void video.play().catch(() => setFailed(true));
              }}
            >
              {zh ? "重试" : "Retry"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
