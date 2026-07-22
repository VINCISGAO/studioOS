"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Film, Flower2, SquarePen } from "lucide-react";
import type { VideoReferenceMode } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    reference: "参考",
    edit: "视频编辑",
    keyframes: "首尾帧"
  },
  en: {
    reference: "Reference",
    edit: "Video edit",
    keyframes: "Start/end frames"
  }
} as const;

const modes: {
  id: VideoReferenceMode;
  labelKey: keyof (typeof copy)["zh"];
  Icon: typeof Flower2;
}[] = [
  { id: "reference", labelKey: "reference", Icon: Flower2 },
  { id: "edit", labelKey: "edit", Icon: SquarePen },
  { id: "keyframes", labelKey: "keyframes", Icon: Film }
];

export function GenerationReferenceMenu({
  locale,
  mode,
  allowedModes = modes.map((item) => item.id),
  onModeChange
}: {
  locale: Locale;
  mode: VideoReferenceMode;
  allowedModes?: VideoReferenceMode[];
  onModeChange: (mode: VideoReferenceMode) => void;
}) {
  const t = copy[locale];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const visibleModes = modes.filter((item) => allowedModes.includes(item.id));
  const current = visibleModes.find((item) => item.id === mode) ?? visibleModes[0] ?? modes[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function choose(next: VideoReferenceMode) {
    onModeChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-2 pr-2.5 text-[11px] text-zinc-700 hover:bg-zinc-50"
      >
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600">
          <current.Icon className="h-3.5 w-3.5" />
        </span>
        <span className="whitespace-nowrap">{t[current.labelKey]}</span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        )}
      </button>

      {open ? (
        <div className="absolute bottom-full left-0 z-[120] mb-2 w-[168px] overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-xl">
          {visibleModes.map(({ id, labelKey, Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => choose(id)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition",
                  active ? "bg-zinc-50" : "hover:bg-zinc-50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-zinc-600" />
                <span className="flex-1 text-xs text-zinc-800">{t[labelKey]}</span>
                {active ? <Check className="h-3.5 w-3.5 shrink-0 text-zinc-900" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
