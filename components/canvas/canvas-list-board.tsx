import Link from "next/link";
import { WandSparkles } from "lucide-react";
import { CreateBlankCanvasButton } from "@/components/canvas/create-blank-canvas-button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

type RecentCanvas = {
  id: string;
  title: string;
  mode: "STANDALONE" | "ORDER";
  updatedAt: string;
};

const copy = {
  zh: {
    title: "AI工具",
    newCanvas: "New Canvas",
    creating: "正在打开…",
    recent: "Recent Canvas",
    empty: "还没有画布。点击 New Canvas 直接进入无限画布。",
    orderBadge: "订单",
    updated: "更新于"
  },
  en: {
    title: "AI Tools",
    newCanvas: "New Canvas",
    creating: "Opening…",
    recent: "Recent Canvas",
    empty: "No canvases yet. New Canvas opens the infinite editor directly.",
    orderBadge: "Order",
    updated: "Updated"
  }
} as const;

function formatUpdatedAt(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function CanvasThumbnail({ title }: { title: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-zinc-200 bg-[linear-gradient(180deg,#fafafa_0%,#f4f4f5_100%)]">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(#e4e4e7 1px, transparent 1px), linear-gradient(90deg, #e4e4e7 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />
      <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-zinc-300/80" />
      <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-md border border-zinc-300 bg-white/80" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/95 to-transparent px-3 py-2">
        <p className="truncate text-xs font-medium text-zinc-700">{title}</p>
      </div>
    </div>
  );
}

export function CanvasListBoard({
  locale,
  recentCanvases
}: {
  locale: Locale;
  recentCanvases: RecentCanvas[];
}) {
  const t = copy[locale];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white">
            <WandSparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{t.title}</h1>
            <p className="text-sm text-zinc-500">{t.recent}</p>
          </div>
        </div>
        <CreateBlankCanvasButton idleLabel={t.newCanvas} pendingLabel={t.creating} />
      </div>

      {recentCanvases.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recentCanvases.map((canvas) => (
            <Link
              key={`${canvas.mode}:${canvas.id}`}
              href={withLocale(creatorPortalRoutes.canvasProject(canvas.id), locale)}
              className="group rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
            >
              <CanvasThumbnail title={canvas.title} />
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">{canvas.title}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    {t.updated} {formatUpdatedAt(canvas.updatedAt, locale)}
                  </p>
                </div>
                {canvas.mode === "ORDER" ? (
                  <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                    {t.orderBadge}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <CreateBlankCanvasButton
          idleLabel={t.newCanvas}
          pendingLabel={t.creating}
          variant="ghost"
        />
      )}
    </div>
  );
}
