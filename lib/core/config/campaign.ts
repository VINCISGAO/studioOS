/** Campaign module config — Vol 13 config/campaign.ts */
export const campaignConfig = {
  maxTitleLength: 100,
  minDescriptionLength: 20,
  maxDescriptionLength: 3000,
  maxCreativeRegenerations: 3,
  defaultCurrency: "USD",
  healthWarningThreshold: 72,
  healthCriticalThreshold: 41
} as const;
