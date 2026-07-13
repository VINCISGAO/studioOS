/** Starter-tier anchor at 15s (USD). */
export const DURATION_START_15S_USD = 250;

/** Starter-tier anchor at 30s (USD). */
export const DURATION_START_30S_USD = 450;

/** Starter-tier anchor at 60s (USD). */
export const DURATION_START_60S_USD = 650;

/**
 * Natural commercial curve — storyboard / shots / prompts scale after 60s.
 * Values are Starter-tier anchors before resolution, rush, style, and quantity.
 */
export const DURATION_STARTER_CURVE_USD: Array<{ seconds: number; starterUsd: number }> = [
  { seconds: 15, starterUsd: 250 },
  { seconds: 30, starterUsd: 450 },
  { seconds: 60, starterUsd: 650 },
  { seconds: 90, starterUsd: 850 },
  { seconds: 120, starterUsd: 1100 },
  { seconds: 180, starterUsd: 1600 },
  { seconds: 240, starterUsd: 2200 },
  { seconds: 300, starterUsd: 2800 }
];

/** Legacy — duration uplift weight inside production engine only. */
export const DURATION_QUOTE_WEIGHT = 0.12;

/** @deprecated Production engine legacy uplift table. */
const LEGACY_DURATION_PRICE_COEFFICIENTS: Array<{ maxSeconds: number; coefficient: number }> = [
  { maxSeconds: 15, coefficient: 1.0 },
  { maxSeconds: 30, coefficient: 1.08 },
  { maxSeconds: 45, coefficient: 1.15 },
  { maxSeconds: 60, coefficient: 1.25 },
  { maxSeconds: 90, coefficient: 1.45 },
  { maxSeconds: 120, coefficient: 1.7 },
  { maxSeconds: 180, coefficient: 2.1 },
  { maxSeconds: 240, coefficient: 2.75 },
  { maxSeconds: 300, coefficient: 3.35 }
];

export function durationSecondsFromBrief(duration: string, customDuration = "") {
  if (duration === "custom") {
    const raw = customDuration.trim().toLowerCase();
    const secMatch = raw.match(/(\d+)\s*s/);
    if (secMatch) return Number(secMatch[1]);
    const minMatch = raw.match(/(\d+)\s*m/);
    if (minMatch) return Number(minMatch[1]) * 60;
    const numeric = Number(raw.replace(/[^\d]/g, ""));
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    return 60;
  }
  const seconds = Number(duration.replace(/[^0-9]/g, ""));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 60;
}

/** Interpolate the Starter anchor across the duration curve. */
export function durationStartingPriceUsd(seconds: number) {
  const curve = DURATION_STARTER_CURVE_USD;
  const clamped = Math.max(curve[0]!.seconds, seconds);
  if (clamped <= curve[0]!.seconds) return curve[0]!.starterUsd;

  for (let index = 1; index < curve.length; index += 1) {
    const prev = curve[index - 1]!;
    const current = curve[index]!;
    if (clamped <= current.seconds) {
      const ratio = (clamped - prev.seconds) / (current.seconds - prev.seconds);
      return Math.round(prev.starterUsd + (current.starterUsd - prev.starterUsd) * ratio);
    }
  }

  const last = curve[curve.length - 1]!;
  const previous = curve[curve.length - 2]!;
  const slope = (last.starterUsd - previous.starterUsd) / (last.seconds - previous.seconds);
  return Math.round(last.starterUsd + slope * (clamped - last.seconds));
}

export function durationStartingPriceFromBrief(duration: string, customDuration = "") {
  return durationStartingPriceUsd(durationSecondsFromBrief(duration, customDuration));
}

/** Ratio vs 60s Starter anchor — for complexity / display hints. */
export function overOneMinuteCoefficient(seconds: number) {
  if (seconds <= 60) return 1;
  return durationStartingPriceUsd(seconds) / DURATION_START_60S_USD;
}

/** @deprecated Production engine legacy uplift table. */
export function durationPriceCoefficient(seconds: number) {
  const row = LEGACY_DURATION_PRICE_COEFFICIENTS.find((item) => seconds <= item.maxSeconds);
  if (row) return row.coefficient;
  const anchor = LEGACY_DURATION_PRICE_COEFFICIENTS[LEGACY_DURATION_PRICE_COEFFICIENTS.length - 1]!;
  return anchor.coefficient * (seconds / anchor.maxSeconds);
}

/** @deprecated Alias for durationStartingPriceFromBrief. */
export function durationBasePriceUsd(duration: string, customDuration = "") {
  return durationStartingPriceFromBrief(duration, customDuration);
}
