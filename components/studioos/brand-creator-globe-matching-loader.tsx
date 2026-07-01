"use client";

import { useEffect, useState } from "react";
import { creators } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BrainCircuit, Globe2, ShieldCheck, Zap } from "lucide-react";

const ORBIT_AVATARS = creators.slice(0, 6).map((creator, index) => ({
  id: creator.id,
  name: creator.name,
  initials: creator.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
  angle: index * 60,
  tone: ["from-violet-400 to-indigo-500", "from-sky-400 to-blue-500", "from-fuchsia-400 to-purple-500", "from-cyan-400 to-teal-500", "from-rose-400 to-pink-500", "from-amber-400 to-orange-500"][index]
}));

const copy = {
  en: {
    titleLead: "Matching the world's ",
    titleHighlight: "best-fit",
    titleTail: " creators",
    subtitle: "AI analysis in progress — please wait…",
    matching: "Smart matching",
    features: [
      { icon: Globe2, label: "120+ countries", detail: "Creator network" },
      { icon: BrainCircuit, label: "AI matching", detail: "Precision fit" },
      { icon: Zap, label: "Fast response", detail: "Quick connect" },
      { icon: ShieldCheck, label: "Vetted talent", detail: "Quality assured" }
    ],
    footnote: "StudioOS makes brand–creator collaboration simpler and more successful"
  },
  zh: {
    titleLead: "正在匹配全球",
    titleHighlight: "最合适的",
    titleTail: "创作者",
    subtitle: "AI 智能分析中，请稍候…",
    matching: "智能匹配中",
    features: [
      { icon: Globe2, label: "全球 120+ 国家", detail: "创作者资源" },
      { icon: BrainCircuit, label: "AI 智能算法", detail: "精准匹配" },
      { icon: Zap, label: "高效响应", detail: "快速连接" },
      { icon: ShieldCheck, label: "严格审核", detail: "品质保障" }
    ],
    footnote: "StudioOS 让品牌与创作者的合作更简单、更高效、更成功"
  }
} as const;

export function BrandCreatorGlobeMatchingLoader({
  locale,
  className,
  compact = false,
  complete = false
}: {
  locale: Locale;
  className?: string;
  compact?: boolean;
  complete?: boolean;
}) {
  const t = copy[locale];
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    if (complete) {
      setProgress(100);
      return;
    }

    setProgress(12);
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - started;
      const target = Math.min(92, 12 + Math.floor(elapsed / 45));
      setProgress((value) => (target > value ? target : value));
    }, 120);

    return () => window.clearInterval(timer);
  }, [complete]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-gradient-to-b from-white via-violet-50/30 to-white",
        compact ? "px-4 py-10 sm:px-6" : "px-6 py-12 sm:px-10 sm:py-14",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(139,92,246,0.12),transparent_58%)]" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
            S
          </span>
          StudioOS
        </div>

        <h2 className={cn("max-w-2xl font-semibold tracking-tight text-zinc-950", compact ? "text-2xl" : "text-3xl sm:text-4xl")}>
          {t.titleLead}
          <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
            {t.titleHighlight}
          </span>
          {t.titleTail}
        </h2>
        <p className="mt-3 text-sm text-zinc-500 sm:text-base">{t.subtitle}</p>

        <div className={cn("relative mx-auto mt-8", compact ? "h-[260px] w-[260px]" : "h-[min(72vw,340px)] w-[min(72vw,340px)]")}>
          <div className="brand-globe-grid absolute inset-[8%] rounded-full opacity-90" />
          <div className="brand-globe-glow absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18),transparent_70%)]" />
          <div className="brand-globe-spin absolute inset-[10%] rounded-full border border-indigo-200/40" />

          <div className="brand-orbit-spin absolute inset-0">
            {ORBIT_AVATARS.map((avatar) => (
              <div
                key={avatar.id}
                className="brand-orbit-item absolute left-1/2 top-1/2 h-0 w-0"
                style={{ transform: `rotate(${avatar.angle}deg) translateY(${compact ? -118 : -148}px)` }}
              >
                <div
                  className="brand-orbit-counter flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-lg shadow-violet-500/20 sm:h-12 sm:w-12"
                >
                  <span className={cn("flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br", avatar.tone)}>
                    {avatar.initials}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="brand-orbit-spin-reverse absolute inset-[14%] rounded-full border border-dashed border-violet-200/60" />

          <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <p className="text-4xl font-bold tabular-nums text-violet-600 sm:text-5xl">{progress}%</p>
            <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm">{t.matching}</p>
          </div>
        </div>

        <div className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {t.features.map((feature) => (
            <div
              key={feature.label}
              className="rounded-2xl border border-zinc-200/80 bg-white/80 px-3 py-3 text-center shadow-sm backdrop-blur-sm sm:px-4 sm:py-4"
            >
              <feature.icon className="mx-auto h-5 w-5 text-violet-600" />
              <p className="mt-2 text-xs font-semibold text-zinc-900 sm:text-sm">{feature.label}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">{feature.detail}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-xl text-xs leading-relaxed text-zinc-400 sm:text-sm">{t.footnote}</p>
      </div>
    </div>
  );
}
