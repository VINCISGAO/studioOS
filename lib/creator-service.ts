import { creators } from "@/lib/data";
import {
  applyStoredProfileToCreator,
  getStoredCreatorProfile
} from "@/lib/creator-profile-service";
import { getCreatorDepositSnapshot } from "@/lib/studioos/deposit-service";
import { getCreatorRatingStats } from "@/lib/order-rating-service";
import { getStoredCreatorSettings } from "@/lib/studioos/creator-settings-service";
import type { Creator } from "@/lib/types";

export async function getCreatorById(id: string): Promise<Creator | null> {
  const base = creators.find((creator) => creator.id === id);
  if (!base) {
    return null;
  }

  const [depositSnapshot, profile, ratingStats, settings] = await Promise.all([
    getCreatorDepositSnapshot(id),
    getStoredCreatorProfile(id),
    getCreatorRatingStats(id),
    getStoredCreatorSettings(id)
  ]);

  let creator = applyStoredProfileToCreator(base, profile);
  const depositPaid = depositSnapshot.deposit_status === "paid";

  creator = {
    ...creator,
    deposit_status: depositSnapshot.deposit_status,
    deposit_amount: depositSnapshot.amount_usd,
    status: depositPaid && creator.status === "deposit_required" ? "active" : creator.status
  };

  if (ratingStats.count > 0) {
    creator = {
      ...creator,
      rating: ratingStats.average,
      order_rating_count: ratingStats.count
    };
  }

  if (settings?.orders_paused) {
    creator = { ...creator, orders_paused: true };
  }

  if (settings?.min_accept_budget_usd) {
    creator = { ...creator, min_project_budget_usd: settings.min_accept_budget_usd };
  }

  if (settings?.account_deleted_at) {
    creator = { ...creator, account_deleted_at: settings.account_deleted_at };
  }

  return creator;
}

export async function listCreatorsForMatching(): Promise<Creator[]> {
  return Promise.all(creators.map((creator) => getCreatorById(creator.id))).then((items) =>
    items.filter((item): item is Creator => Boolean(item))
  );
}

export function getCreatorByIdSync(id: string): Creator | null {
  return creators.find((creator) => creator.id === id) ?? null;
}
