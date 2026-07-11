/**
 * Seed VINCIS Production Pricing Engine benchmarks.
 * Run: npx tsx scripts/seed-production-pricing.ts
 */
import { productionPricingRepository } from "../features/pricing/production-pricing.repository";

async function main() {
  await productionPricingRepository.seedVerifiedBenchmarks();
  const samples = await productionPricingRepository.listBenchmarkSamples();
  console.log(`Seeded production pricing profile v1 + ${samples.length} benchmark sample(s).`);
  for (const sample of samples) {
    console.log(
      `  ${sample.sampleCode} — ${sample.projectName} (${sample.finalDurationSeconds}s, ${sample.generationMultiplier}×)`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../lib/core/database/prisma");
    await prisma.$disconnect();
  });
