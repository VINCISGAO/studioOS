"use client";

import { createPortal } from "react-dom";
import type { Locale } from "@/lib/i18n";
import { CANVAS_GENERATION_MODAL_Z_INDEX } from "@/lib/canvas/generation-ui";
import { seedanceAssetRequirementsCopy } from "@/lib/canvas/seedance-asset-requirements";

export function GenerationSeedanceRequirementsDialog({
  locale,
  open,
  onClose
}: {
  locale: Locale;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  const lines = seedanceAssetRequirementsCopy[locale];

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/35 p-4"
      style={{ zIndex: CANVAS_GENERATION_MODAL_Z_INDEX + 1 }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-base font-semibold text-zinc-950">
          {locale === "zh" ? "Seedance 素材要求" : "Seedance asset requirements"}
        </h3>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
          {lines.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-zinc-300">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white"
        >
          {locale === "zh" ? "知道了" : "Got it"}
        </button>
      </div>
    </div>,
    document.body
  );
}
