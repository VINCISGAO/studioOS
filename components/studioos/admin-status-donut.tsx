import type { AdminOverviewStatusBucket } from "@/features/admin/dashboard/admin-dashboard.types";
import type { Locale } from "@/lib/i18n";
import { campaignStatusLabel } from "@/lib/studioos/admin-i18n";

const palette = [
  "#18181b",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899"
];

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad)
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function AdminStatusDonut({
  locale,
  buckets
}: {
  locale: Locale;
  buckets: AdminOverviewStatusBucket[];
}) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  if (total === 0) {
    return (
      <p className="text-sm text-zinc-500">
        {locale === "zh" ? "暂无状态数据。" : "No status data yet."}
      </p>
    );
  }

  let cursor = 0;
  const segments = buckets.map((bucket, index) => {
    const slice = (bucket.count / total) * 360;
    const start = cursor;
    const end = cursor + slice;
    cursor = end;
    return {
      ...bucket,
      path: describeArc(60, 60, 42, start, end - 0.5),
      color: palette[index % palette.length]
    };
  });

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0">
        {segments.map((segment) => (
          <path
            key={segment.status}
            d={segment.path}
            fill="none"
            stroke={segment.color}
            strokeWidth={14}
            strokeLinecap="butt"
          />
        ))}
        <text x="60" y="56" textAnchor="middle" className="fill-zinc-900 text-[14px] font-semibold">
          {total}
        </text>
        <text x="60" y="72" textAnchor="middle" className="fill-zinc-500 text-[9px]">
          {locale === "zh" ? "活动" : "Campaigns"}
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-2">
        {segments.map((segment) => (
          <li key={segment.status} className="flex items-center justify-between gap-2 text-sm">
            <span className="inline-flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="truncate">{campaignStatusLabel(segment.status, locale)}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums">{segment.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
