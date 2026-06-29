import type { CommissionBreakdown, CommissionSnapshotInput } from "@/features/membership/membership.types";

/** Round to 2 decimal places — all money calculations go through here. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Pure commission calculation — no DB, no hard-coded business rules.
 * Client service fee is computed on order amount (charged to client at checkout).
 * Creator commission is deducted from order amount at settlement.
 */
export function calculateOrderCommission(input: CommissionSnapshotInput): CommissionBreakdown {
  const orderAmount = roundMoney(Math.max(0, input.orderAmount));
  const clientServiceFeePercentage = input.clientServiceFeeEnabled
    ? roundMoney(input.clientServiceFeePercentage)
    : 0;
  const creatorCommissionPercentage = roundMoney(input.creatorCommissionPercentage);

  const clientServiceFeeAmount = input.clientServiceFeeEnabled
    ? roundMoney((orderAmount * clientServiceFeePercentage) / 100)
    : 0;
  const creatorCommissionAmount = roundMoney((orderAmount * creatorCommissionPercentage) / 100);
  const creatorPayoutAmount = roundMoney(orderAmount - creatorCommissionAmount);
  const platformTotalRevenue = roundMoney(clientServiceFeeAmount + creatorCommissionAmount);

  if (creatorPayoutAmount < 0) {
    throw new Error("Creator payout cannot be negative");
  }

  return {
    orderAmount,
    currency: input.currency ?? "USD",
    clientServiceFeePercentage,
    clientServiceFeeAmount,
    creatorCommissionPercentage,
    creatorCommissionAmount,
    creatorPayoutAmount,
    platformTotalRevenue,
    creatorMembershipType: input.creatorMembershipType
  };
}

/** Validate admin-configured percentages before persisting. */
export function assertValidCommissionPercentages(input: {
  clientServiceFeePercentage: number;
  defaultCreatorCommissionPercentage: number;
  verifiedCreatorCommissionPercentage: number;
}) {
  const fields = [
    input.clientServiceFeePercentage,
    input.defaultCreatorCommissionPercentage,
    input.verifiedCreatorCommissionPercentage
  ];
  for (const value of fields) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error("Commission percentages must be between 0 and 100");
    }
  }
  if (input.verifiedCreatorCommissionPercentage > input.defaultCreatorCommissionPercentage) {
    throw new Error("Verified creator commission should not exceed default creator commission");
  }
}

export function computeUpgradeProgress(settledRevenue: number, threshold: number): number {
  if (threshold <= 0) return 100;
  return Math.min(100, Math.round((settledRevenue / threshold) * 100));
}

/** Regression tests for commission math — used by membership-verify.ts */
export function runCommissionCalculationTests(): { name: string; ok: boolean; detail?: string }[] {
  const checks: { name: string; ok: boolean; detail?: string }[] = [];

  const defaultCase = calculateOrderCommission({
    orderAmount: 1000,
    creatorCommissionPercentage: 20,
    clientServiceFeePercentage: 10,
    clientServiceFeeEnabled: true,
    creatorMembershipType: "DEFAULT"
  });
  checks.push({
    name: "default_creator_1000",
    ok:
      defaultCase.clientServiceFeeAmount === 100 &&
      defaultCase.creatorCommissionAmount === 200 &&
      defaultCase.creatorPayoutAmount === 800 &&
      defaultCase.platformTotalRevenue === 300,
    detail: JSON.stringify(defaultCase)
  });

  const verifiedCase = calculateOrderCommission({
    orderAmount: 1000,
    creatorCommissionPercentage: 10,
    clientServiceFeePercentage: 10,
    clientServiceFeeEnabled: true,
    creatorMembershipType: "VERIFIED"
  });
  checks.push({
    name: "verified_creator_1000",
    ok:
      verifiedCase.clientServiceFeeAmount === 100 &&
      verifiedCase.creatorCommissionAmount === 100 &&
      verifiedCase.creatorPayoutAmount === 900 &&
      verifiedCase.platformTotalRevenue === 200,
    detail: JSON.stringify(verifiedCase)
  });

  const disabledFee = calculateOrderCommission({
    orderAmount: 500,
    creatorCommissionPercentage: 20,
    clientServiceFeePercentage: 10,
    clientServiceFeeEnabled: false,
    creatorMembershipType: "DEFAULT"
  });
  checks.push({
    name: "client_fee_disabled",
    ok: disabledFee.clientServiceFeeAmount === 0 && disabledFee.platformTotalRevenue === 100
  });

  const partial = calculateOrderCommission({
    orderAmount: 333.33,
    creatorCommissionPercentage: 20,
    clientServiceFeePercentage: 10,
    clientServiceFeeEnabled: true,
    creatorMembershipType: "DEFAULT"
  });
  checks.push({
    name: "partial_amount_rounding",
    ok: partial.creatorPayoutAmount + partial.creatorCommissionAmount === partial.orderAmount
  });

  try {
    assertValidCommissionPercentages({
      clientServiceFeePercentage: 10,
      defaultCreatorCommissionPercentage: 20,
      verifiedCreatorCommissionPercentage: 10
    });
    checks.push({ name: "valid_percentages", ok: true });
  } catch {
    checks.push({ name: "valid_percentages", ok: false });
  }

  try {
    assertValidCommissionPercentages({
      clientServiceFeePercentage: 10,
      defaultCreatorCommissionPercentage: 5,
      verifiedCreatorCommissionPercentage: 20
    });
    checks.push({ name: "invalid_verified_gt_default", ok: false });
  } catch {
    checks.push({ name: "invalid_verified_gt_default", ok: true });
  }

  checks.push({
    name: "upgrade_progress",
    ok: computeUpgradeProgress(150, 300) === 50 && computeUpgradeProgress(300, 300) === 100
  });

  return checks;
}
