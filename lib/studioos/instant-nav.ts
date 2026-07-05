import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { logger } from "@/lib/core/logger";

/** Fire async work without blocking navigation. */
export function runInBackground(task: () => Promise<void>, label: string) {
  void task().catch((error) => {
    logger.warn("Background task failed", { label, error: error instanceof Error ? error.message : String(error) });
  });
}

/** Update wizard URL without triggering Next.js RSC navigation (keeps step switches instant). */
export function syncBrandWizardStepUrl(projectId: string, step: number, locale: Locale) {
  if (typeof window === "undefined") return;
  const url = withLocale(`/brand/projects/new?project=${encodeURIComponent(projectId)}&step=${step}`, locale);
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new CustomEvent("brand-wizard-step", { detail: { step } }));
}

export function readBrandWizardStepFromLocation() {
  if (typeof window === "undefined") return 1;
  return Number(new URLSearchParams(window.location.search).get("step")) || 1;
}
