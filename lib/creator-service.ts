import { creators } from "@/lib/data";
import {
  applyStoredProfileToCreator,
  getStoredCreatorProfile
} from "@/lib/creator-profile-service";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { getCreatorDepositSnapshot } from "@/lib/studioos/deposit-service";
import { normalizeCountryCode } from "@/lib/geo/country";
import { getCreatorRatingStats } from "@/lib/order-rating-service";
import { getStoredCreatorSettings } from "@/lib/studioos/creator-settings-service";
import type { Creator } from "@/lib/types";

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

async function creatorBaseFromProfile(
  profile: {
    id: string;
    legacyCreatorId: string | null;
    displayName: string;
    headline: string | null;
    bio: string | null;
    country: string | null;
    city: string | null;
    portfolioCover: string | null;
    portfolioUrl: string | null;
    specialtiesJson: unknown;
    toolsJson: unknown;
    expertiseDomainsJson: unknown;
    minBudget: { toString(): string } | null;
    profileCompletedAt: Date | null;
    createdAt: Date;
    user: { email: string; avatarUrl: string | null; createdAt: Date };
  }
): Promise<Creator> {
  const canonicalId = profile.legacyCreatorId ?? profile.id;
  const minBudget = profile.minBudget == null ? 0 : Number(profile.minBudget);

  return {
    id: canonicalId,
    name: profile.displayName,
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    avatar_url: profile.user.avatarUrl ?? undefined,
    cover_url: profile.portfolioCover ?? undefined,
    country: normalizeCountryCode(profile.country ?? "") || "",
    city: profile.city ?? undefined,
    email: profile.user.email,
    portfolio_url: profile.portfolioUrl ?? "",
    specialties: stringList(profile.specialtiesJson),
    tools: stringList(profile.toolsJson),
    expertise_domains: stringList(profile.expertiseDomainsJson),
    rating: 5,
    delivery_speed: "72 hours",
    min_project_budget_usd: minBudget,
    status: "deposit_required",
    deposit_status: "unpaid",
    deposit_amount: 99,
    profile_completed_at: profile.profileCompletedAt?.toISOString() ?? null,
    created_at: profile.createdAt.toISOString()
  };
}

async function listRegisteredDatabaseCreators(seedKeys: Set<string>): Promise<Creator[]> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  const profiles = await prisma.creatorProfile.findMany({
    where: {
      user: { role: "CREATOR", deletedAt: null, status: "ACTIVE" },
      availability: { in: ["AVAILABLE", "BUSY"] }
    },
    include: {
      user: { select: { email: true, avatarUrl: true, createdAt: true } }
    }
  });

  const registered: Creator[] = [];
  for (const profile of profiles) {
    const canonicalId = profile.legacyCreatorId ?? profile.id;
    const dedupeKey = `${canonicalId}:${profile.user.email.toLowerCase()}`;
    if (seedKeys.has(dedupeKey) || seedKeys.has(canonicalId) || seedKeys.has(profile.user.email.toLowerCase())) {
      continue;
    }

    registered.push(await enrichCreator(await creatorBaseFromProfile(profile)));
  }

  return registered;
}

async function getDatabaseCreatorBase(creatorId: string): Promise<Creator | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  const profileId = await resolveCreatorProfileIdForLegacyId(creatorId);
  const profile = await prisma.creatorProfile.findFirst({
    where: {
      OR: [
        { id: creatorId },
        { legacyCreatorId: creatorId },
        ...(profileId ? [{ id: profileId }] : [])
      ]
    },
    include: {
      user: { select: { email: true, avatarUrl: true, createdAt: true } }
    }
  });

  if (!profile?.user.email) {
    return null;
  }

  return creatorBaseFromProfile(profile);
}

async function enrichCreator(base: Creator): Promise<Creator> {
  const [depositSnapshot, profile, ratingStats, settings] = await Promise.all([
    getCreatorDepositSnapshot(base.id),
    getStoredCreatorProfile(base.id),
    getCreatorRatingStats(base.id),
    getStoredCreatorSettings(base.id)
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

export async function getCreatorById(id: string): Promise<Creator | null> {
  const base = creators.find((creator) => creator.id === id) ?? (await getDatabaseCreatorBase(id));
  if (!base) {
    return null;
  }

  return enrichCreator(base);
}

export async function listCreatorsForMatching(): Promise<Creator[]> {
  const seedKeys = new Set<string>();
  for (const creator of creators) {
    seedKeys.add(creator.id);
    seedKeys.add(creator.email.toLowerCase());
    seedKeys.add(`${creator.id}:${creator.email.toLowerCase()}`);
  }

  const [seedMatches, registeredMatches] = await Promise.all([
    Promise.all(creators.map((creator) => getCreatorById(creator.id))),
    listRegisteredDatabaseCreators(seedKeys)
  ]);

  const merged = new Map<string, Creator>();
  for (const creator of [...seedMatches, ...registeredMatches]) {
    if (!creator) continue;
    merged.set(creator.id, creator);
  }

  return [...merged.values()];
}

export function getCreatorByIdSync(id: string): Creator | null {
  return creators.find((creator) => creator.id === id) ?? null;
}
