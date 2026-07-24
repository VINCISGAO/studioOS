"use client";

import { CAMERA_MOVEMENTS, type CameraMovementId } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const CAMERA_PANEL_SHELL_CLASS =
  "rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl";

export function GenerationCameraPickerPanel({
  locale,
  selected,
  onChange,
  onClose
}: {
  locale: Locale;
  selected: CameraMovementId[];
  onChange: (movements: CameraMovementId[]) => void;
  onClose: () => void;
}) {
  function toggle(id: CameraMovementId) {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  }

  return (
    <div className={CAMERA_PANEL_SHELL_CLASS}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-950">
          {locale === "zh" ? "基础镜头" : "Camera moves"}
        </h3>
        <button type="button" onClick={onClose} className="text-xs text-zinc-400 hover:text-zinc-700">
          {locale === "zh" ? "完成" : "Done"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {CAMERA_MOVEMENTS.map((movement) => {
          const active = selected.includes(movement.id);
          return (
            <button
              key={movement.id}
              type="button"
              onClick={() => toggle(movement.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition",
                active
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              )}
            >
              {movement.label[locale]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GenerationCameraPicker({
  locale,
  selected,
  onChange,
  onClose
}: {
  locale: Locale;
  selected: CameraMovementId[];
  onChange: (movements: CameraMovementId[]) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 w-[min(92vw,360px)]">
      <GenerationCameraPickerPanel
        locale={locale}
        selected={selected}
        onChange={onChange}
        onClose={onClose}
      />
    </div>
  );
}
