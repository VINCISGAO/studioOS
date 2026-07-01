import "server-only";

import {
  canUseBusinessFeatures,
  canUseIncomeFeatures,
  countCompletedCreatorOrders,
  isLockedAfterFirstOrder,
  resolveCreatorAccess
} from "@/lib/studioos/deposit-guard";
import { getCreatorDepositSnapshot } from "@/lib/studioos/deposit-service";
import type { CreatorDepositSnapshot } from "@/lib/studioos/deposit-types";
import type { StoredOrder } from "@/lib/order-types";

export type CreatorCertificationAccess = {
  snapshot: CreatorDepositSnapshot;
  completedOrders: number;
  isVerified: boolean;
  canUseBusinessFeatures: boolean;
  canUseIncomeFeatures: boolean;
  isLockedAfterFirstOrder: boolean;
};

/** Deposit snapshot is the single source of truth for certification / paid status. */
export async function resolveCreatorCertificationAccess(
  creatorId: string,
  completedOrders: number
): Promise<CreatorCertificationAccess> {
  const snapshot = await getCreatorDepositSnapshot(creatorId);
  const isVerified = snapshot.deposit_status === "paid";
  const access = resolveCreatorAccess({ completedOrders, isVerified });

  return {
    snapshot,
    completedOrders: access.completedOrders,
    isVerified: access.isVerified,
    canUseBusinessFeatures: canUseBusinessFeatures(access.completedOrders, access.isVerified),
    canUseIncomeFeatures: canUseIncomeFeatures(access.completedOrders, access.isVerified),
    isLockedAfterFirstOrder: isLockedAfterFirstOrder(access.completedOrders, access.isVerified)
  };
}

export async function resolveCreatorCertificationAccessFromOrders(
  creatorId: string,
  orders: Pick<StoredOrder, "status">[]
): Promise<CreatorCertificationAccess> {
  return resolveCreatorCertificationAccess(creatorId, countCompletedCreatorOrders(orders));
}
