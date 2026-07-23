/**
 * Mureka API USD → VINCIS Credits conversion.
 *
 * Exchange anchor (CreditExchangeRateConfig): 100 Credits = $1.00 USD.
 * Service fee: +10% on top of Mureka provider cost (owner policy 2026-07-23).
 *
 * @see docs/MUREKA_CREDITS_PRICING.md
 * @see docs/PRODUCTION_PRICING_ENGINE.md
 */

export const MUREKA_SERVICE_FEE_RATE = 0.1;

export const MUREKA_USD_UNIT_PRICES = {
  /** Song / BGM / instrumental — V7.6 */
  tierV76Song: 0.03,
  /** Song / BGM — V8 / V9 / Oxygen */
  tierPremiumSong: 0.045,
  /** Prompted singing (not wired in Canvas Phase 1) */
  promptedSinging: 0.3,
  /** Soundtrack V9 image/video (Phase 2) */
  soundtrackV9: 0.1,
  /** Full lyrics generation (often bundled with custom vocal) */
  lyricsFull: 0.009,
  /** Single-line lyrics */
  lyricsLine: 0.002,
  /** Song extension V7.6 */
  extendV76: 0.036,
  /** Song extension V8 */
  extendV8: 0.1,
  /** Remix V8 */
  remixV8: 0.2,
  /** Single-track V8 */
  singleTrackV8: 0.09,
  /** Vocal clone ID */
  vocalClone: 5,
  /** Stem V1 / V2 / V3 */
  stemV1: 0.06,
  stemV2: 0.7,
  stemV3: 0.2,
  /** Describe song */
  describeSong: 0.1,
  /** Transcription */
  transcription: 0.2,
  /** Lyrics video */
  lyricsVideo: 0.1,
  /** TTS standard (per hour) */
  ttsStandardHour: 4.9,
  /** TTS podcast (per hour) */
  ttsPodcastHour: 6.9
} as const;

export function murekaProviderCostMinor(murekaUsd: number) {
  return Math.max(1, Math.round(murekaUsd * 100));
}

/** Customer price in Credits (integer). Always rounds up; minimum 1 Credit. */
export function murekaUsdToCreditPrice(murekaUsd: number) {
  const withFee = murekaUsd * (1 + MUREKA_SERVICE_FEE_RATE);
  return Math.max(1, Math.ceil(withFee * 100));
}

/** Gross margin on revenue (for admin pricing rules), not the 10% cost markup. */
export function murekaGrossMarginPercent(murekaUsd: number, creditPrice: number) {
  const providerMinor = murekaProviderCostMinor(murekaUsd);
  const revenueMinor = creditPrice;
  if (revenueMinor <= 0) return null;
  return Math.round(((revenueMinor - providerMinor) / revenueMinor) * 100);
}

export type MurekaMusicTier = "v76" | "premium";

export function canvasMusicMurekaUnitUsd(input: {
  tier: MurekaMusicTier;
  mode: "SIMPLE" | "CUSTOM" | "SOUNDTRACK";
  instrumental: boolean;
  includesLyricsApi?: boolean;
}) {
  const songUsd =
    input.tier === "v76"
      ? MUREKA_USD_UNIT_PRICES.tierV76Song
      : MUREKA_USD_UNIT_PRICES.tierPremiumSong;

  if (input.mode === "SOUNDTRACK") {
    // Phase 1 Canvas uses instrumental fallback; official V9 soundtrack is $0.10.
    return songUsd;
  }

  if (input.instrumental || input.mode === "SIMPLE") {
    return songUsd;
  }

  const lyricsUsd = input.includesLyricsApi ? MUREKA_USD_UNIT_PRICES.lyricsFull : 0;
  return songUsd + lyricsUsd;
}

export function canvasMusicCreditQuote(input: {
  tier: MurekaMusicTier;
  mode: "SIMPLE" | "CUSTOM" | "SOUNDTRACK";
  instrumental: boolean;
  includesLyricsApi?: boolean;
}) {
  const murekaUsd = canvasMusicMurekaUnitUsd(input);
  const creditPrice = murekaUsdToCreditPrice(murekaUsd);
  return {
    murekaUsd,
    providerCostMinor: murekaProviderCostMinor(murekaUsd),
    creditPrice,
    marginPercent: murekaGrossMarginPercent(murekaUsd, creditPrice)
  };
}
