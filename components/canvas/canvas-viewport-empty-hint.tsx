"use client";

import type { Locale } from "@/lib/i18n";

export function CanvasViewportEmptyHint({
  locale,
  onBackToContent
}: {
  locale: Locale;
  onBackToContent: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-2.5 shadow-lg">
        <span className="text-sm text-zinc-700">
          {locale === "zh" ? "视口内无内容" : "No content in viewport"}
        </span>
        <button
          type="button"
          onClick={onBackToContent}
          className="rounded-full border border-zinc-200 px-3 py-1 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
        >
          {locale === "zh" ? "回到内容" : "Back to content"}
        </button>
      </div>
    </div>
  );
}
