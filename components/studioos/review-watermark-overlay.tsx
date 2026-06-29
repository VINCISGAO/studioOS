"use client";

import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ReviewWatermarkOverlay({
  locale,
  brandName,
  brandEmail,
  sessionId,
  className
}: {
  locale: Locale;
  brandName: string;
  brandEmail: string;
  sessionId: string;
  className?: string;
}) {
  const today = new Date().toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US");

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute left-3 top-3 rounded-lg bg-black/55 px-3 py-2 text-[10px] leading-5 text-white/90 backdrop-blur-sm",
          className
        )}
      >
        <p className="font-semibold">{brandName}</p>
        <p>{brandEmail}</p>
        <p>
          Session: {sessionId}
        </p>
        <p>{today}</p>
        <p className="font-medium text-amber-200/90">
          {locale === "zh" ? "审片版 · 仅供审阅" : "Review Only"}
        </p>
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[12%] top-[18%] rotate-[-18deg] text-[11px] font-medium tracking-wide text-white/[0.15]">
          {brandName} · {locale === "zh" ? "审片版" : "Review Copy"}
        </div>
        <div className="absolute right-[10%] top-[42%] rotate-[12deg] text-[11px] font-medium tracking-wide text-white/[0.15]">
          {sessionId} · {locale === "zh" ? "禁止商用" : "Commercial Use Prohibited"}
        </div>
        <div className="absolute bottom-[22%] left-[28%] rotate-[-8deg] text-[11px] font-medium tracking-wide text-white/[0.15]">
          {locale === "zh" ? "StudioOS 保护" : "Protected by StudioOS"}
        </div>
      </div>
    </>
  );
}
