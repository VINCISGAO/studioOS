"use client";

import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Finding your best creator match",
    subtitle: "Scanning studios by style, budget, and delivery fit…",
    scanning: "Scanning"
  },
  zh: {
    title: "正在为您匹配最适合您的创作者",
    subtitle: "基于风格、预算与工期，智能扫描 Studio 库…",
    scanning: "扫描中"
  }
};

const BLIPS = [
  { top: "22%", left: "62%", delay: "0s" },
  { top: "58%", left: "28%", delay: "0.8s" },
  { top: "38%", left: "72%", delay: "1.4s" },
  { top: "68%", left: "55%", delay: "2.1s" }
];

export function BrandCreatorMatchRadar({
  locale,
  className
}: {
  locale: Locale;
  className?: string;
}) {
  const t = copy[locale];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-12",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-sm flex-col items-center text-center">
        <div className="relative h-[min(72vw,280px)] w-[min(72vw,280px)]">
          <div className="absolute inset-0 rounded-full border border-sky-400/10" />
          <div className="absolute inset-[12%] rounded-full border border-sky-400/15" />
          <div className="absolute inset-[24%] rounded-full border border-sky-400/20" />
          <div className="absolute inset-[36%] rounded-full border border-sky-400/25" />
          <div className="absolute inset-[48%] rounded-full border border-sky-400/30 bg-sky-500/5" />

          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, rgba(56,189,248,0.45) 28deg, rgba(56,189,248,0.08) 55deg, transparent 80deg)"
            }}
          >
            <div className="brand-radar-sweep absolute inset-0 rounded-full" />
          </div>

          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_42%,rgba(8,47,73,0.35)_100%)]" />

          {BLIPS.map((blip, index) => (
            <span
              key={index}
              className="brand-radar-blip absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.9)]"
              style={{ top: blip.top, left: blip.left, animationDelay: blip.delay }}
            />
          ))}

          <div className="absolute left-1/2 top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.9)]">
            <div className="brand-radar-core absolute inset-0 rounded-full bg-sky-300" />
          </div>

          <div className="absolute inset-x-[18%] top-1/2 h-px -translate-y-1/2 bg-sky-400/20" />
          <div className="absolute inset-y-[18%] left-1/2 w-px -translate-x-1/2 bg-sky-400/20" />
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-lg font-semibold leading-snug tracking-tight sm:text-xl">{t.title}</p>
          <p className="text-sm leading-relaxed text-zinc-400">{t.subtitle}</p>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
            </span>
            {t.scanning}
          </div>
        </div>
      </div>
    </div>
  );
}
