export const CREATOR_DEPOSIT_CURRENCY = "USD" as const;

/** $99.00 certification deposit — always store/transact in minor units (cents). */
export const CREATOR_DEPOSIT_AMOUNT_MINOR = 9_900;

export function depositAmountUsdFromMinor(amountMinor: number) {
  return amountMinor / 100;
}

export function depositAmountMinorFromUsd(amountUsd: number) {
  return Math.round(amountUsd * 100);
}
