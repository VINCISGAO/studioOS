export { CREATOR_DEPOSIT_USD, depositRequiredMessage, depositRequiredTitle } from "@/lib/studioos/deposit-copy";
import type { Creator } from "@/lib/types";

export function hasPaidCreatorDeposit(creator: Creator | null | undefined): boolean {
  return creator?.deposit_status === "paid";
}

export function hasCompletedCreatorProfile(creator: Creator | null | undefined): boolean {
  return Boolean(creator?.profile_completed_at);
}

export function canUseStudioFeatures(creator: Creator | null | undefined): boolean {
  return hasPaidCreatorDeposit(creator) && hasCompletedCreatorProfile(creator);
}
