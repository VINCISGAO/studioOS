/** Payment & escrow config — Vol 09 */
export const paymentConfig = {
  /** @deprecated Use CommissionRule + CreatorMembershipPlan from DB at settlement time. */
  platformCommissionPercent: 10,
  minWithdrawUsd: 100,
  maxWithdrawPerDay: 1,
  maxWithdrawPerWeek: 5,
  milestones: [
    { key: "project_start", percent: 15 },
    { key: "v1_upload", percent: 20 },
    { key: "v2_approved", percent: 15 },
    { key: "final_approval", percent: 40 },
    { key: "rating", percent: 10 }
  ] as const,
  defaultCurrency: "USD"
} as const;
