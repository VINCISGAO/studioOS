/** AI Gateway config — Vol 10 + cost tracking */
export const aiConfig = {
  promptVersion: "creative-direction-v1",
  defaultModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  maxRetries: 2,
  pricingPer1MTokens: {
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini-template": { input: 0, output: 0 }
  } as Record<string, { input: number; output: number }>
} as const;

export function estimateTokenCost(model: string, tokenInput: number, tokenOutput: number) {
  const pricing = aiConfig.pricingPer1MTokens[model] ?? aiConfig.pricingPer1MTokens["gpt-4o-mini"];
  const cost = (tokenInput / 1_000_000) * pricing.input + (tokenOutput / 1_000_000) * pricing.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function hasOpenAI() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
