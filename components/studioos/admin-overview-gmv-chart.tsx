"use client";

import { useMemo, useState } from "react";
import type { AdminOverviewGmvTrendSeries, GmvTrendPeriod } from "@/features/admin/dashboard/admin-dashboard.types";
import type { Locale } from "@/lib/i18n";
import { cn, formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    day: "Day",
    week: "Week",
    month: "Month",
    gmv: "GMV",
    escrow: "Escrow",
    revenue: "Revenue",
    subtitle: "Last 14 days · escrow inflow & platform revenue"
  },
  zh: {
    day: "日",
    week: "周",
    month: "月",
    gmv: "GMV",
    escrow: "托管",
    revenue: "收入",
    subtitle: "近 14 日 · 托管入账与平台收入"
  }
};

const seriesColors = {
  gmv: "#18181b",
  escrow: "#3b82f6",
  revenue: "#10b981"
};

type SeriesKey = "gmv" | "escrow" | "revenue";

function buildPath(
  values: number[],
  width: number,
  height: number,
  max: number
) {
  if (values.length === 0) return "";
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function AdminOverviewGmvChart({
  locale,
  trend
}: {
  locale: Locale;
  trend: AdminOverviewGmvTrendSeries;
}) {
  const t = copy[locale];
  const [period, setPeriod] = useState<GmvTrendPeriod>("day");
  const points = trend[period];

  const max = useMemo(() => {
    const peak = Math.max(
      ...points.flatMap((p) => [p.gmv, p.escrow, p.revenue]),
      1
    );
    return peak;
  }, [points]);

  const width = 640;
  const height = 160;
  const paths = useMemo(
    () => ({
      gmv: buildPath(
        points.map((p) => p.gmv),
        width,
        height,
        max
      ),
      escrow: buildPath(
        points.map((p) => p.escrow),
        width,
        height,
        max
      ),
      revenue: buildPath(
        points.map((p) => p.revenue),
        width,
        height,
        max
      )
    }),
    [points, max]
  );

  const tabs: Array<{ id: GmvTrendPeriod; label: string }> = [
    { id: "day", label: t.day },
    { id: "week", label: t.week },
    { id: "month", label: t.month }
  ];

  const legend: Array<{ key: SeriesKey; label: string; color: string }> = [
    { key: "gmv", label: t.gmv, color: seriesColors.gmv },
    { key: "escrow", label: t.escrow, color: seriesColors.escrow },
    { key: "revenue", label: t.revenue, color: seriesColors.revenue }
  ];

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border bg-white p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPeriod(tab.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                period === tab.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {legend.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height + 24}`} className="h-44 w-full min-w-[320px]">
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={0}
              x2={width}
              y1={height * (1 - ratio)}
              y2={height * (1 - ratio)}
              stroke="#e4e4e7"
              strokeWidth={1}
            />
          ))}
          {(Object.keys(paths) as SeriesKey[]).map((key) => (
            <path
              key={key}
              d={paths[key]}
              fill="none"
              stroke={seriesColors[key]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {points.map((point, index) => {
            const step = points.length > 1 ? width / (points.length - 1) : 0;
            const x = index * step;
            return (
              <text
                key={point.date}
                x={x}
                y={height + 16}
                textAnchor="middle"
                className="fill-zinc-400 text-[10px]"
              >
                {period === "month" ? point.date.slice(5) : point.date.slice(5)}
              </text>
            );
          })}
        </svg>
      </div>

      <p className="mt-2 text-xs text-zinc-500">{t.subtitle}</p>
      {points.length > 0 ? (
        <p className="mt-1 text-xs text-zinc-400">
          {locale === "zh" ? "最新" : "Latest"}: {formatCurrency(points[points.length - 1]?.gmv ?? 0, locale)} GMV
        </p>
      ) : null}
    </div>
  );
}
