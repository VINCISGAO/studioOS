"use client";

import type { SchemeRadarScores } from "@/lib/studioos/brand-campaign-scheme-metrics";
import type { Locale } from "@/lib/i18n";
import { formatMoneyFromUsd } from "@/lib/money/display-money";
import { cn } from "@/lib/utils";

const RADAR_LABELS = {
  zh: ["吸引力", "共鸣度", "记忆点", "转化力", "难度"],
  en: ["Appeal", "Resonance", "Memory", "Conversion", "Difficulty"]
} as const;

function polarPoint(cx: number, cy: number, radius: number, angleRad: number) {
  return {
    x: cx + radius * Math.sin(angleRad),
    y: cy - radius * Math.cos(angleRad)
  };
}

export function SchemeMetricSparkline({ seed, className }: { seed: number; className?: string }) {
  const width = 56;
  const height = 22;
  const points = Array.from({ length: 7 }, (_, index) => {
    const x = (index / 6) * width;
    const wave = Math.sin((seed + index) * 1.4) * 0.35 + Math.cos((seed + index) * 0.7) * 0.2;
    const y = height - 4 - (0.45 + wave) * (height - 8);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="#a78bfa"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SchemeRadarChart({
  locale,
  scores,
  size = 132,
  className,
  compactLabels = false
}: {
  locale: Locale;
  scores: SchemeRadarScores;
  size?: number;
  className?: string;
  compactLabels?: boolean;
}) {
  const labels = RADAR_LABELS[locale];
  const values = [scores.appeal, scores.resonance, scores.memorability, scores.conversion, scores.difficulty];
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34;

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = values.map((value, index) => {
    const angle = (Math.PI * 2 * index) / values.length;
    const r = (value / 100) * maxR;
    return polarPoint(cx, cy, r, angle);
  });
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const chart = (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="shrink-0">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={values
            .map((_, index) => {
              const angle = (Math.PI * 2 * index) / values.length;
              const p = polarPoint(cx, cy, maxR * ring, angle);
              return `${p.x},${p.y}`;
            })
            .join(" ")}
          fill="none"
          stroke="#e9d5ff"
          strokeWidth="1"
        />
      ))}
      {values.map((_, index) => {
        const angle = (Math.PI * 2 * index) / values.length;
        const p = polarPoint(cx, cy, maxR, angle);
        return <line key={index} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#ede9fe" strokeWidth="1" />;
      })}
      <polygon points={polygon} fill="rgba(124,58,237,0.22)" stroke="#7c3aed" strokeWidth="2" />
      {dataPoints.map((p, index) => (
        <circle key={index} cx={p.x} cy={p.y} r="3" fill="#7c3aed" />
      ))}
    </svg>
  );

  if (compactLabels) {
    return (
      <div className={cn("flex items-start gap-3", className)}>
        {chart}
        <div className="min-w-0 flex-1 space-y-1 text-[10px] leading-4 text-zinc-500">
          {labels.map((label, index) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span>{label}</span>
              <span className="font-medium tabular-nums text-zinc-700">{values[index]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {chart}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-zinc-500">
        {labels.map((label, index) => (
          <span key={label} className="flex justify-between gap-2">
            <span>{label}</span>
            <span className="font-medium tabular-nums text-zinc-700">{values[index]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SchemeBudgetDonut({
  total,
  slices,
  locale
}: {
  total: number;
  slices: Array<{ key: string; amount: number; color: string }>;
  locale: Locale;
}) {
  const size = 120;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const fmt = (amount: number) => formatMoneyFromUsd(amount, locale);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f4f4f5" strokeWidth={stroke} />
          {slices.map((slice) => {
            const fraction = total > 0 ? slice.amount / total : 0;
            const dash = fraction * circumference;
            const circle = (
              <circle
                key={slice.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-lg font-semibold text-zinc-950">{fmt(total)}</p>
          <p className="text-[10px] text-zinc-500">{locale === "zh" ? "总预算" : "Total budget"}</p>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2 text-xs">
        {slices.map((slice) => {
          const pct = total > 0 ? Math.round((slice.amount / total) * 100) : 0;
          return (
            <li key={slice.key} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-zinc-600">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="truncate">{slice.key}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums text-zinc-900">
                {pct}%
                <span className="ml-1.5 text-zinc-600">{fmt(slice.amount)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
