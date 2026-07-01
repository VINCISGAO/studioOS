/**
 * Local-only override for studio sidebar / route access tests.
 * Set `enabled: true` and adjust counts — no database required.
 *
 * Case A — first order free:     completedOrders: 0, isVerified: false
 * Case B — locked after 1st:    completedOrders: 1, isVerified: false
 * Case C — certified, all open: completedOrders: 1, isVerified: true
 */
export const CREATOR_ACCESS_MOCK = {
  enabled: false,
  completedOrders: 0,
  isVerified: false
} as const;

export type CreatorAccessSnapshot = {
  completedOrders: number;
  isVerified: boolean;
};

export function resolveCreatorAccessSnapshot(input: {
  completedOrders: number;
  isVerified: boolean;
}): CreatorAccessSnapshot {
  if (!CREATOR_ACCESS_MOCK.enabled) {
    return input;
  }

  return {
    completedOrders: CREATOR_ACCESS_MOCK.completedOrders,
    isVerified: CREATOR_ACCESS_MOCK.isVerified
  };
}
