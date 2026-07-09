"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { resolveHomeHeroVideoSrc } from "@/lib/marketing/home-hero-video-sources";

const videoLabels: Record<MarketingLocale, { video: string; soundOn: string; mute: string; soundOnAria: string; muteAria: string }> = {
  en: {
    video: "VINCIS homepage promotional video",
    soundOn: "Sound on",
    mute: "Mute",
    soundOnAria: "Turn video sound on",
    muteAria: "Mute video"
  },
  "zh-CN": { video: "VINCIS 首页宣传视频", soundOn: "开启声音", mute: "静音", soundOnAria: "开启视频声音", muteAria: "静音视频" },
  "zh-TW": { video: "VINCIS 首頁宣傳影片", soundOn: "開啟聲音", mute: "靜音", soundOnAria: "開啟影片聲音", muteAria: "將影片靜音" },
  ja: { video: "VINCIS ホームページ紹介動画", soundOn: "音声オン", mute: "ミュート", soundOnAria: "動画の音声をオンにする", muteAria: "動画をミュート" },
  ko: { video: "VINCIS 홈페이지 홍보 영상", soundOn: "소리 켜기", mute: "음소거", soundOnAria: "영상 소리 켜기", muteAria: "영상 음소거" },
  ms: { video: "Video promosi halaman utama VINCIS", soundOn: "Hidupkan bunyi", mute: "Senyap", soundOnAria: "Hidupkan bunyi video", muteAria: "Senyapkan video" },
  km: { video: "វីដេអូផ្សព្វផ្សាយទំព័រដើម VINCIS", soundOn: "បើកសំឡេង", mute: "បិទសំឡេង", soundOnAria: "បើកសំឡេងវីដេអូ", muteAria: "បិទសំឡេងវីដេអូ" },
  th: { video: "วิดีโอโปรโมตหน้าแรก VINCIS", soundOn: "เปิดเสียง", mute: "ปิดเสียง", soundOnAria: "เปิดเสียงวิดีโอ", muteAria: "ปิดเสียงวิดีโอ" },
  vi: { video: "Video giới thiệu trang chủ VINCIS", soundOn: "Bật âm thanh", mute: "Tắt tiếng", soundOnAria: "Bật âm thanh video", muteAria: "Tắt tiếng video" },
  fr: { video: "Vidéo promotionnelle de la page d'accueil VINCIS", soundOn: "Activer le son", mute: "Muet", soundOnAria: "Activer le son de la vidéo", muteAria: "Couper le son de la vidéo" },
  es: { video: "Vídeo promocional de la página de inicio de VINCIS", soundOn: "Activar sonido", mute: "Silenciar", soundOnAria: "Activar el sonido del vídeo", muteAria: "Silenciar el vídeo" }
};

export function HomeHeroVideo({ locale }: { locale: Locale | MarketingLocale }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);
  const videoLocale: MarketingLocale = locale === "zh" ? "zh-CN" : (locale as MarketingLocale);
  const labels = videoLabels[videoLocale] ?? videoLabels.en;
  const videoSrc = resolveHomeHeroVideoSrc(videoLocale);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !muted;
    try {
      video.muted = nextMuted;
      if (!nextMuted) {
        video.volume = 1;
        void video.play().catch(() => undefined);
      }
      setMuted(nextMuted);
    } catch {
      setMuted(video.muted);
    }
  }

  return (
    <section className="bg-black px-0 py-0 lg:px-8 lg:py-0">
      <div className="relative w-full overflow-hidden rounded-none bg-black shadow-none lg:mx-auto lg:max-w-[1216px] lg:shadow-[0_28px_90px_-64px_rgba(0,0,0,0.55)]">
        <video
          key={videoSrc}
          ref={videoRef}
          className="aspect-[21/9] w-full object-cover"
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="none"
          aria-label={labels.video}
          onCanPlay={() => setHasVideoError(false)}
          onError={() => setHasVideoError(true)}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        {!hasVideoError ? (
          <button
            type="button"
            onClick={toggleSound}
            className="absolute left-3 top-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 text-xs font-medium text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-4 sm:top-4 sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
            aria-pressed={!muted}
            aria-label={muted ? labels.soundOnAria : labels.muteAria}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            <span>{muted ? labels.soundOn : labels.mute}</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}
