"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  CANVAS_BACKGROUND_PRESETS,
  hexToHsv,
  hsvToHex,
  normalizeHexColor
} from "@/lib/canvas/color";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function CanvasBackgroundColorPicker({
  locale,
  color,
  onChange,
  onClose
}: {
  locale: Locale;
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const [hexInput, setHexInput] = useState(color.replace("#", ""));

  useEffect(() => {
    const next = hexToHsv(color);
    setHsv(next);
    setHexInput(color.replace("#", ""));
  }, [color]);

  function applyHsv(next: { h: number; s: number; v: number }) {
    setHsv(next);
    const hex = hsvToHex(next.h, next.s, next.v);
    setHexInput(hex.replace("#", ""));
    onChange(hex);
  }

  function pickArea(event: React.PointerEvent<HTMLDivElement>) {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const v = Math.min(100, Math.max(0, (1 - (event.clientY - rect.top) / rect.height) * 100));
    applyHsv({ ...hsv, s, v });
  }

  return (
    <div className="w-[248px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
        <span className="text-sm font-medium text-zinc-900">
          {locale === "zh" ? "画布背景色" : "Canvas background"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3 p-3">
        <div
          ref={areaRef}
          className="relative h-28 cursor-crosshair overflow-hidden rounded-xl border border-zinc-200"
          style={{
            backgroundColor: hsvToHex(hsv.h, 100, 100),
            backgroundImage:
              "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)"
          }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            pickArea(event);
          }}
          onPointerMove={(event) => {
            if (event.buttons !== 1) return;
            pickArea(event);
          }}
        >
          <span
            className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
            style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={360}
          value={Math.round(hsv.h)}
          onChange={(event) => applyHsv({ ...hsv, h: Number(event.target.value) })}
          className="h-2 w-full cursor-pointer appearance-none rounded-full"
          style={{
            background:
              "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)"
          }}
        />

        <div className="flex items-center gap-2">
          {CANVAS_BACKGROUND_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={preset}
              onClick={() => onChange(preset)}
              className={cn(
                "h-5 w-5 rounded-full border border-zinc-200",
                color === preset && "ring-2 ring-zinc-900 ring-offset-1"
              )}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
          <span className="text-zinc-400">#</span>
          <input
            value={hexInput}
            onChange={(event) => {
              const value = event.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
              setHexInput(value);
              const normalized = normalizeHexColor(value);
              if (normalized) {
                onChange(normalized);
              }
            }}
            className="w-full bg-transparent uppercase outline-none"
            maxLength={6}
          />
        </div>
      </div>
    </div>
  );
}
