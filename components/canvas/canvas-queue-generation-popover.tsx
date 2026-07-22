"use client";

import { QUEUE_GENERATION_MODELS, type QueueGenerationModelIcon } from "@/lib/canvas/queue-generation-ui";
import type { Locale } from "@/lib/i18n";

function QueueModelIcon({ icon }: { icon: QueueGenerationModelIcon }) {
  if (icon === "openai") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[9px] font-semibold text-zinc-200">
        AI
      </span>
    );
  }
  if (icon === "midjourney") {
    return (
      <span className="flex h-5 w-5 items-center justify-center text-zinc-300">
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
          <path
            fill="currentColor"
            d="M10 3.5c-1.2 2.2-2.4 3.4-4.8 4.1 2.4.7 3.6 1.9 4.8 4.1 1.2-2.2 2.4-3.4 4.8-4.1-2.4-.7-3.6-1.9-4.8-4.1Z"
          />
        </svg>
      </span>
    );
  }
  if (icon === "banana") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-400/15 text-[11px]">
        🍌
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-400/10 text-[10px] font-semibold text-sky-200">
      S
    </span>
  );
}

export function CanvasQueueGenerationPopover({
  locale,
  title
}: {
  locale: Locale;
  title: string;
}) {
  return (
    <div className="w-[248px] overflow-hidden rounded-2xl bg-[#121212] py-2.5 text-white shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
      <div className="px-3.5 pb-2 text-[13px] font-medium text-white">{title}</div>
      <div className="max-h-[320px] overflow-y-auto">
        {QUEUE_GENERATION_MODELS.map((model) => (
          <div
            key={model.id}
            className="flex items-center gap-2.5 px-3.5 py-2 text-left"
          >
            <QueueModelIcon icon={model.icon} />
            <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-100">
              {model.label[locale]}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              {model.tierBadge ? (
                <span className="rounded-md bg-zinc-700/90 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                  {model.tierBadge[locale]}
                </span>
              ) : null}
              <span className="rounded-md bg-zinc-700/90 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                {model.daysBadge[locale]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
