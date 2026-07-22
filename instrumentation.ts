export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { creditPricingIntegrityService } = await import(
    "@/features/credit-wallet/credit-pricing-integrity.service"
  );
  await creditPricingIntegrityService.validateStartup();
}
