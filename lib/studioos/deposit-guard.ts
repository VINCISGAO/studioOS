export { CREATOR_DEPOSIT_USD, depositRequiredMessage, depositRequiredTitle } from "@/lib/studioos/deposit-copy";
import { resolveCreatorAccessSnapshot } from "@/lib/studioos/creator-access-mock";
import type { StoredOrder } from "@/lib/order-types";
import type { Creator } from "@/lib/types";

export function hasPaidCreatorDeposit(creator: Creator | null | undefined): boolean {
  return creator?.deposit_status === "paid";
}

/** @deprecated Use hasPaidCreatorDeposit() for deposit checks or resolveCreatorEligibility().platform verification when enforcement is ON. */
export function isCreatorVerified(creator: Creator | null | undefined): boolean {
  return hasPaidCreatorDeposit(creator);
}

export function canAcceptCreatorOrdersLegacy(input: {
  depositPaid: boolean;
  profileCompleted: boolean;
  completedOrders: number;
}): boolean {
  return input.completedOrders === 0 || input.depositPaid;
}

export function hasCompletedCreatorProfile(creator: Creator | null | undefined): boolean {
  return Boolean(creator?.profile_completed_at);
}

export function countCompletedCreatorOrders(orders: Pick<StoredOrder, "status">[]): number {
  return orders.filter((order) => order.status === "completed").length;
}

export function resolveCreatorAccess(input: {
  completedOrders: number;
  isVerified: boolean;
}) {
  return resolveCreatorAccessSnapshot(input);
}

/** completedOrders === 0 || isVerified — first order free, then certify to continue. */
export function canUseBusinessFeatures(completedOrders: number, isVerified: boolean): boolean {
  return completedOrders === 0 || isVerified;
}

/** Income & withdrawal stay available after the free order, even before certification. */
export function canUseIncomeFeatures(_completedOrders: number, _isVerified: boolean): boolean {
  void _completedOrders;
  void _isVerified;
  return true;
}

/** completedOrders >= 1 && !isVerified */
export function isLockedAfterFirstOrder(completedOrders: number, isVerified: boolean): boolean {
  return completedOrders >= 1 && !isVerified;
}

export function getCreatorAccessState(
  creator: Creator | null | undefined,
  completedOrders: number
) {
  const isVerified = isCreatorVerified(creator);
  const access = resolveCreatorAccess({ completedOrders, isVerified });

  return {
    completedOrders: access.completedOrders,
    isVerified: access.isVerified,
    canUseBusinessFeatures: canUseBusinessFeatures(access.completedOrders, access.isVerified),
    canUseIncomeFeatures: canUseIncomeFeatures(access.completedOrders, access.isVerified),
    isLockedAfterFirstOrder: isLockedAfterFirstOrder(access.completedOrders, access.isVerified)
  };
}

/** Protected studio routes redirect to deposit when locked after first order. */
export function requiresCreatorCertification(
  creator: Creator | null | undefined,
  completedOrders: number
): boolean {
  const { isLockedAfterFirstOrder: locked } = getCreatorAccessState(creator, completedOrders);
  return locked;
}

/** Sidebar business items + notifications — same rule as canUseBusinessFeatures. */
export function isStudioPortalUnlocked(
  creator: Creator | null | undefined,
  completedOrders: number
): boolean {
  const { canUseBusinessFeatures: unlocked } = getCreatorAccessState(creator, completedOrders);
  return unlocked;
}

export function canAcceptCreatorOrders(
  creator: Creator | null | undefined,
  completedOrders: number
): boolean {
  return isStudioPortalUnlocked(creator, completedOrders);
}

export function canUseStudioFeatures(
  creator: Creator | null | undefined,
  completedOrders = 0
): boolean {
  if (isCreatorVerified(creator) && hasCompletedCreatorProfile(creator)) {
    return true;
  }
  return isStudioPortalUnlocked(creator, completedOrders);
}
