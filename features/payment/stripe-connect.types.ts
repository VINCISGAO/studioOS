export type StripeConnectStatusView = {
  configured: boolean;
  accountId: string | null;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  onboardedAt: string | null;
  dashboardUrl: string | null;
  requiresOnboarding: boolean;
};

export type StripeConnectOnboardResult = {
  accountId: string;
  onboardingUrl: string;
};

export type StripeConnectTransferResult = {
  transferId: string;
  amountUsd: number;
  currency: string;
  destinationAccountId: string;
};
