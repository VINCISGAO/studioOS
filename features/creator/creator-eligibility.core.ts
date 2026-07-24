import type { CreatorAvailability } from "@prisma/client";
import type {
  CreatorEligibility,
  CreatorEligibilityLegacyInput,
  CreatorEligibilityProfileInput,
  CreatorEligibilityReason
} from "@/features/creator/creator-eligibility.types";

function canAcceptCreatorOrdersLegacy(input: {
  depositPaid: boolean;
  profileCompleted: boolean;
  completedOrders: number;
}): boolean {
  return input.completedOrders === 0 || input.depositPaid;
}

const BLOCKING_AVAILABILITY = new Set<CreatorAvailability>(["VACATION", "UNAVAILABLE", "OFFLINE"]);

function isUserActive(profile: CreatorEligibilityProfileInput): boolean {
  return profile.user.status === "ACTIVE" && profile.user.deletedAt == null;
}

function isAvailabilityBlockingInvitations(availability: CreatorAvailability): boolean {
  return BLOCKING_AVAILABILITY.has(availability);
}

function pushReason(reasons: CreatorEligibilityReason[], reason: CreatorEligibilityReason): void {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
}

function verificationBlockReason(
  status: CreatorEligibilityProfileInput["verificationStatus"]
): CreatorEligibilityReason {
  switch (status) {
    case "NOT_APPLIED":
      return "VERIFICATION_NOT_APPLIED";
    case "PENDING":
      return "VERIFICATION_PENDING";
    case "REJECTED":
      return "VERIFICATION_REJECTED";
    case "SUSPENDED":
      return "VERIFICATION_SUSPENDED";
    default:
      return "VERIFICATION_NOT_APPROVED";
  }
}

export function resolveCreatorEligibility(
  profile: CreatorEligibilityProfileInput,
  legacy: CreatorEligibilityLegacyInput,
  enforcementEnabled: boolean
): CreatorEligibility {
  const reasons: CreatorEligibilityReason[] = [];
  const isCreatorRole = profile.user.role === "CREATOR" || profile.user.role == null;

  const canUseAiTools = isCreatorRole && isUserActive(profile);
  const canPublishPortfolio = isCreatorRole && isUserActive(profile);

  if (!enforcementEnabled) {
    const legacyCanAccept = canAcceptCreatorOrdersLegacy({
      depositPaid: legacy.depositPaid,
      profileCompleted: legacy.profileCompleted,
      completedOrders: legacy.completedOrders
    });

    if (legacy.accountDeleted) pushReason(reasons, "ACCOUNT_DELETED");
    if (legacy.ordersPaused) pushReason(reasons, "ORDERS_PAUSED");
    if (!legacy.depositPaid && legacy.completedOrders > 0) pushReason(reasons, "DEPOSIT_REQUIRED");
    if (!legacy.profileCompleted) pushReason(reasons, "PROFILE_INCOMPLETE");
    if (!isUserActive(profile)) {
      pushReason(reasons, profile.user.deletedAt ? "USER_DELETED" : "USER_NOT_ACTIVE");
    }
    if (isAvailabilityBlockingInvitations(profile.availability)) {
      pushReason(
        reasons,
        profile.availability === "VACATION" ? "AVAILABILITY_VACATION" : "AVAILABILITY_UNAVAILABLE"
      );
    }

    const canReceiveInvitations =
      legacyCanAccept &&
      !legacy.ordersPaused &&
      !legacy.accountDeleted &&
      isUserActive(profile) &&
      !isAvailabilityBlockingInvitations(profile.availability);

    const canAppearInMarketplace =
      legacy.profileCompleted && isUserActive(profile) && !legacy.accountDeleted;

    return {
      canUseAiTools,
      canAppearInMarketplace,
      canReceiveInvitations,
      canSubmitProposal: canReceiveInvitations,
      canAcceptProject: canReceiveInvitations,
      canPublishPortfolio,
      reasons
    };
  }

  const platformApproved = profile.verificationStatus === "APPROVED";

  if (!platformApproved) {
    pushReason(reasons, verificationBlockReason(profile.verificationStatus));
  }
  if (!profile.canAcceptProjects) {
    pushReason(reasons, "CAN_ACCEPT_PROJECTS_DISABLED");
  }
  if (!profile.marketplaceVisible) {
    pushReason(reasons, "MARKETPLACE_HIDDEN");
  }
  if (!isUserActive(profile)) {
    pushReason(reasons, profile.user.deletedAt ? "USER_DELETED" : "USER_NOT_ACTIVE");
  }
  if (isAvailabilityBlockingInvitations(profile.availability)) {
    pushReason(
      reasons,
      profile.availability === "VACATION" ? "AVAILABILITY_VACATION" : "AVAILABILITY_UNAVAILABLE"
    );
  }
  if (legacy.ordersPaused) pushReason(reasons, "ORDERS_PAUSED");
  if (legacy.accountDeleted) pushReason(reasons, "ACCOUNT_DELETED");

  const verificationGate = platformApproved && profile.canAcceptProjects && isUserActive(profile);
  const invitationGate =
    verificationGate &&
    !legacy.ordersPaused &&
    !legacy.accountDeleted &&
    !isAvailabilityBlockingInvitations(profile.availability);

  const depositGate = canAcceptCreatorOrdersLegacy({
    depositPaid: legacy.depositPaid,
    profileCompleted: legacy.profileCompleted,
    completedOrders: legacy.completedOrders
  });

  if (!depositGate && legacy.completedOrders > 0) {
    pushReason(reasons, "DEPOSIT_REQUIRED");
  }

  const canAppearInMarketplace =
    platformApproved && profile.marketplaceVisible && isUserActive(profile) && !legacy.accountDeleted;

  const canReceiveInvitations = invitationGate;
  const canSubmitProposal = verificationGate && depositGate && !legacy.ordersPaused && !legacy.accountDeleted;
  const canAcceptProject = canSubmitProposal;

  return {
    canUseAiTools,
    canAppearInMarketplace,
    canReceiveInvitations,
    canSubmitProposal,
    canAcceptProject,
    canPublishPortfolio,
    reasons
  };
}

export function profileInputFromPrismaRow(
  profile: CreatorEligibilityProfileInput & { id?: string; userId?: string }
): CreatorEligibilityProfileInput {
  return {
    verificationStatus: profile.verificationStatus,
    canAcceptProjects: profile.canAcceptProjects,
    marketplaceVisible: profile.marketplaceVisible,
    availability: profile.availability,
    identityType: profile.identityType,
    profileCompletedAt: profile.profileCompletedAt,
    user: profile.user
  };
}

export function legacyInputFromCreatorDto(input: {
  deposit_status?: string | null;
  profile_completed_at?: string | null;
  orders_paused?: boolean;
  account_deleted_at?: string | null;
  completedOrders?: number;
}): CreatorEligibilityLegacyInput {
  return {
    depositPaid: input.deposit_status === "paid",
    profileCompleted: Boolean(input.profile_completed_at),
    ordersPaused: Boolean(input.orders_paused),
    accountDeleted: Boolean(input.account_deleted_at),
    completedOrders: input.completedOrders ?? 0
  };
}
