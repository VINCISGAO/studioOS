"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { resolveHomeHeroVideoSrc } from "@/lib/marketing/home-hero-video-sources";

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
  const [muted, setMuted] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    };

    syncDuration();
    syncProgress();
    video.addEventListener("loadedmetadata", syncDuration);
    video.addEventListener("durationchange", syncDuration);
    video.addEventListener("timeupdate", syncProgress);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      video.removeEventListener("loadedmetadata", syncDuration);
      video.removeEventListener("durationchange", syncDuration);
      video.removeEventListener("timeupdate", syncProgress);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [videoSrc]);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !muted;
    video.muted = nextMuted;
    if (!nextMuted) {
      video.volume = 1;
      void video.play().catch(() => undefined);
    }
    setMuted(nextMuted);
  }

  function handleSeek(nextTime: number) {
    const video = videoRef.current;
    if (!video || !Number.isFinite(nextTime)) return;
    video.currentTime = nextTime;
    setProgress(nextTime);
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

  return (
    <section className="bg-black px-0 py-0 lg:px-8 lg:py-0">
      <div
        ref={shellRef}
        className="relative w-full overflow-hidden rounded-none bg-black shadow-none lg:mx-auto lg:max-w-[1216px] lg:shadow-[0_28px_90px_-64px_rgba(0,0,0,0.55)]"
      >
        <video
          key={videoSrc}
          ref={videoRef}
          src={videoSrc}
          className="aspect-[21/9] w-full object-cover"
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="auto"
          aria-label={labels.video}
          onCanPlay={() => setHasVideoError(false)}
          onError={() => setHasVideoError(true)}
        />
        {!hasVideoError ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-3 pb-3 pt-10 sm:px-4 sm:pb-4">
            <div className="pointer-events-auto space-y-2">
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
                onChange={(event) => handleSeek(Number(event.target.value))}
                className="home-hero-video-range h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-white"
                aria-label={labels.seek}
                aria-valuemin={0}
                aria-valuemax={duration || 0}
                aria-valuenow={progress}
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium tabular-nums text-white/80 sm:text-xs">
                  {formatVideoTime(progress)} / {formatVideoTime(duration)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSound}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:h-10 sm:w-10"
                    aria-pressed={!muted}
                    aria-label={muted ? labels.soundOnAria : labels.muteAria}
                  >
                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:h-10 sm:w-10"
                    aria-label={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
