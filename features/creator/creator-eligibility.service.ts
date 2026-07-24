import "server-only";

import { featureFlagService } from "@/features/admin/feature-flag.service";
import {
  legacyInputFromCreatorDto,
  profileInputFromPrismaRow,
  resolveCreatorEligibility
} from "@/features/creator/creator-eligibility.core";
import {
  CREATOR_LIFECYCLE_ENFORCEMENT_FLAG,
  type CreatorEligibility,
  type CreatorEligibilityLegacyInput,
  type CreatorEligibilityProfileInput
} from "@/features/creator/creator-eligibility.types";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { appError } from "@/lib/core/errors";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";

export {
  legacyInputFromCreatorDto,
  profileInputFromPrismaRow,
  resolveCreatorEligibility
} from "@/features/creator/creator-eligibility.core";

export async function isCreatorLifecycleEnforcementEnabled(): Promise<boolean> {
  return featureFlagService.isEnabled(CREATOR_LIFECYCLE_ENFORCEMENT_FLAG);
}

export async function loadCreatorEligibilityProfileByProfileId(
  creatorProfileId: string
): Promise<(CreatorEligibilityProfileInput & { id: string; userId: string }) | null> {
  if (!hasDatabaseUrl()) return null;

  const profile = await prisma.creatorProfile.findUnique({
    where: { id: creatorProfileId },
    include: {
      user: { select: { status: true, deletedAt: true, role: true } },
      depositAccount: { select: { depositStatus: true } }
    }
  });

  if (!profile) return null;

  return {
    id: profile.id,
    userId: profile.userId,
    verificationStatus: profile.verificationStatus,
    canAcceptProjects: profile.canAcceptProjects,
    marketplaceVisible: profile.marketplaceVisible,
    availability: profile.availability,
    identityType: profile.identityType,
    profileCompletedAt: profile.profileCompletedAt,
    user: profile.user
  };
}

export async function loadCreatorEligibilityLegacyByProfileId(
  creatorProfileId: string,
  completedOrders = 0
): Promise<CreatorEligibilityLegacyInput> {
  if (!hasDatabaseUrl()) {
    return {
      depositPaid: false,
      profileCompleted: false,
      ordersPaused: false,
      accountDeleted: false,
      completedOrders
    };
  }

  const profile = await prisma.creatorProfile.findUnique({
    where: { id: creatorProfileId },
    select: {
      profileCompletedAt: true,
      user: { select: { deletedAt: true } },
      depositAccount: { select: { depositStatus: true } }
    }
  });

  if (!profile) {
    return {
      depositPaid: false,
      profileCompleted: false,
      ordersPaused: false,
      accountDeleted: false,
      completedOrders
    };
  }

  return {
    depositPaid: profile.depositAccount?.depositStatus === "PAID",
    profileCompleted: profile.profileCompletedAt != null,
    ordersPaused: false,
    accountDeleted: profile.user.deletedAt != null,
    completedOrders
  };
}

export async function resolveCreatorEligibilityForProfileId(
  creatorProfileId: string,
  completedOrders = 0
): Promise<CreatorEligibility | null> {
  const profile = await loadCreatorEligibilityProfileByProfileId(creatorProfileId);
  if (!profile) return null;

  const legacy = await loadCreatorEligibilityLegacyByProfileId(creatorProfileId, completedOrders);
  const enforcementEnabled = await isCreatorLifecycleEnforcementEnabled();
  return resolveCreatorEligibility(profile, legacy, enforcementEnabled);
}

export async function assertCreatorEligibility(
  creatorProfileId: string,
  gate: keyof Pick<
    CreatorEligibility,
    | "canAppearInMarketplace"
    | "canReceiveInvitations"
    | "canSubmitProposal"
    | "canAcceptProject"
  >,
  completedOrders = 0
): Promise<CreatorEligibility> {
  const eligibility = await resolveCreatorEligibilityForProfileId(creatorProfileId, completedOrders);
  if (!eligibility) {
    throw appError("NOT_FOUND", "Creator profile not found");
  }
  if (!eligibility[gate]) {
    throw appError("FORBIDDEN", `Creator not eligible: ${eligibility.reasons.join(", ") || gate}`);
  }
  return eligibility;
}

export async function resolveCreatorEligibilityFromDto(
  profile: CreatorEligibilityProfileInput,
  legacy: CreatorEligibilityLegacyInput
): Promise<CreatorEligibility> {
  const enforcementEnabled = await isCreatorLifecycleEnforcementEnabled();
  return resolveCreatorEligibility(profile, legacy, enforcementEnabled);
}

export async function assertCreatorProposalEligibilityForLegacyCreatorId(
  legacyCreatorId: string,
  completedOrders: number
): Promise<CreatorEligibility> {
  const profileId = await resolveCreatorProfileIdForLegacyId(legacyCreatorId);
  if (!profileId) {
    const enforcementEnabled = await isCreatorLifecycleEnforcementEnabled();
    if (!enforcementEnabled) {
      return {
        canUseAiTools: true,
        canAppearInMarketplace: true,
        canReceiveInvitations: true,
        canSubmitProposal: true,
        canAcceptProject: true,
        canPublishPortfolio: true,
        reasons: []
      };
    }
    throw appError("FORBIDDEN", "Creator profile required for platform verification");
  }

  return assertCreatorEligibility(profileId, "canSubmitProposal", completedOrders);
}

export async function filterEligibleCreatorProfilesForMatching<
  T extends CreatorEligibilityProfileInput & { id: string; userId: string }
>(profiles: T[], completedOrdersByUserId: Map<string, number> = new Map()): Promise<T[]> {
  const enforcementEnabled = await isCreatorLifecycleEnforcementEnabled();
  if (!enforcementEnabled) return profiles;

  const eligible: T[] = [];
  for (const profile of profiles) {
    const legacy = await loadCreatorEligibilityLegacyByProfileId(
      profile.id,
      completedOrdersByUserId.get(profile.userId) ?? 0
    );
    const eligibility = resolveCreatorEligibility(profile, legacy, true);
    if (eligibility.canReceiveInvitations) {
      eligible.push(profile);
    }
  }
  return eligible;
}
