/** 15s anchor — duration is a low-weight factor vs shots / complexity. */
export const DURATION_BASE_15S_USD = 200;

/** Duration contributes ~10–15% of final quote; shots drive the rest. */
export const DURATION_QUOTE_WEIGHT = 0.12;

const DURATION_PRICE_COEFFICIENTS: Array<{ maxSeconds: number; coefficient: number }> = [
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

export function durationPriceCoefficient(seconds: number) {
  const row = DURATION_PRICE_COEFFICIENTS.find((item) => seconds <= item.maxSeconds);
  if (row) return row.coefficient;
  const anchor = DURATION_PRICE_COEFFICIENTS[DURATION_PRICE_COEFFICIENTS.length - 1]!;
  return anchor.coefficient * (seconds / anchor.maxSeconds);
}

export function durationBasePriceUsd(duration: string, customDuration = "") {
  const seconds = durationSecondsFromBrief(duration, customDuration);
  return Math.round(DURATION_BASE_15S_USD * durationPriceCoefficient(seconds));
}
