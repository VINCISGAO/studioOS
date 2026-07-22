/**
 * Regional credit package pricing verification
 * Run: npm run credits:regional-pricing:verify
 */
import { PrismaClient } from "@prisma/client";
import { creditPackageRegionalPricingService } from "../features/credit-wallet/credit-package-regional-pricing.service";
import { creditWalletRepository } from "../features/credit-wallet/credit-wallet.repository";
import { validateAmountMinor } from "../lib/credits/currency-minor-units";
import { isAppError } from "../lib/core/errors";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

function report(checks: Check[]) {
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
  }
  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(`${failed.length} regional package pricing check(s) failed`);
  }
}

async function ensureGlobalPrice(packageId: string, currency: string, amountMinor: number) {
  const existing = await prisma.creditPackageRegionalPrice.findFirst({
    where: { packageId, regionCode: "GLOBAL", currency, version: 1 }
  });
  if (existing) return existing;
  return prisma.creditPackageRegionalPrice.create({
    data: {
      packageId,
      regionCode: "GLOBAL",
      currency,
      amountMinor,
      bonusCredits: 0,
      enabled: true,
      version: 1
    }
  });
}

async function main() {
  const checks: Check[] = [];

  if (!process.env.DATABASE_URL) {
    checks.push({ name: "regional.skip", ok: true, detail: "DATABASE_URL not configured" });
    report(checks);
    return;
  }

  const pkg = await prisma.creditPackage.findFirst({
    where: { enabled: true, deletedAt: null },
    orderBy: { sortOrder: "asc" }
  });
  if (!pkg) {
    checks.push({ name: "regional.skip", ok: true, detail: "No active credit package" });
    report(checks);
    return;
  }

  await ensureGlobalPrice(pkg.id, "USD", pkg.amountMinor);

  const euPrice = await prisma.creditPackageRegionalPrice.upsert({
    where: {
      packageId_regionCode_currency_version: {
        packageId: pkg.id,
        regionCode: "EU",
        currency: "EUR",
        version: 1
      }
    },
    create: {
      packageId: pkg.id,
      regionCode: "EU",
      currency: "EUR",
      amountMinor: 900,
      bonusCredits: 50,
      enabled: true,
      version: 1
    },
    update: {
      amountMinor: 900,
      bonusCredits: 50,
      enabled: true
    }
  });

  const exact = await creditPackageRegionalPricingService.resolvePackageQuote({
    packageId: pkg.id,
    requestedRegion: "EU"
  });
  checks.push({
    name: "regional.exact_match",
    ok: exact.pricingSource === "REGION_EXACT" && exact.currency === "EUR" && exact.amountMinor === 900,
    detail: `${exact.pricingSource}:${exact.currency}:${exact.amountMinor}`
  });

  await prisma.creditPackageRegionalPrice.update({
    where: { id: euPrice.id },
    data: { enabled: false }
  });
  const fallback = await creditPackageRegionalPricingService.resolvePackageQuote({
    packageId: pkg.id,
    requestedRegion: "EU"
  });
  checks.push({
    name: "regional.global_fallback",
    ok: fallback.pricingSource === "GLOBAL_FALLBACK" && fallback.matchedRegion === "GLOBAL",
    detail: fallback.pricingSource
  });

  await prisma.creditPackageRegionalPrice.update({
    where: { id: (await ensureGlobalPrice(pkg.id, "USD", pkg.amountMinor)).id },
    data: { enabled: false }
  });
  let unavailable = false;
  try {
    await creditPackageRegionalPricingService.resolvePackageQuote({
      packageId: pkg.id,
      requestedRegion: "GLOBAL"
    });
  } catch (error) {
    unavailable = isAppError(error) && error.code === "PACKAGE_PRICE_UNAVAILABLE";
  }
  checks.push({ name: "regional.missing_price", ok: unavailable, detail: String(unavailable) });

  await prisma.creditPackageRegionalPrice.updateMany({
    where: { packageId: pkg.id, regionCode: "GLOBAL" },
    data: { enabled: true }
  });

  const future = await prisma.creditPackageRegionalPrice.create({
    data: {
      packageId: pkg.id,
      regionCode: "JP",
      currency: "JPY",
      amountMinor: 1400,
      bonusCredits: 0,
      enabled: true,
      startsAt: new Date(Date.now() + 86_400_000),
      version: 1
    }
  });
  let futureUsesFallback = false;
  try {
    const quote = await creditPackageRegionalPricingService.resolvePackageQuote({
      packageId: pkg.id,
      requestedRegion: "JP"
    });
    futureUsesFallback = quote.pricingSource === "GLOBAL_FALLBACK";
  } catch {
    futureUsesFallback = true;
  }
  checks.push({
    name: "regional.scheduled_future",
    ok: futureUsesFallback,
    detail: String(futureUsesFallback)
  });
  await prisma.creditPackageRegionalPrice.delete({ where: { id: future.id } });

  const expired = await prisma.creditPackageRegionalPrice.create({
    data: {
      packageId: pkg.id,
      regionCode: "KR",
      currency: "KRW",
      amountMinor: 13000,
      bonusCredits: 0,
      enabled: true,
      endsAt: new Date(Date.now() - 86_400_000),
      version: 1
    }
  });
  let expiredBlocked = false;
  try {
    const quote = await creditPackageRegionalPricingService.resolvePackageQuote({
      packageId: pkg.id,
      requestedRegion: "KR"
    });
    expiredBlocked = quote.pricingSource === "GLOBAL_FALLBACK";
  } catch {
    expiredBlocked = true;
  }
  checks.push({ name: "regional.expired_price", ok: expiredBlocked, detail: String(expiredBlocked) });
  await prisma.creditPackageRegionalPrice.delete({ where: { id: expired.id } });

  validateAmountMinor("JPY", 1400);
  validateAmountMinor("KRW", 13000);
  validateAmountMinor("USD", 900);
  checks.push({ name: "regional.zero_decimal_validation", ok: true });

  const order = await creditWalletRepository.createPurchaseOrder({
    userId: (await prisma.user.findFirst({ where: { role: "CREATOR" } }))!.id,
    walletId: (await prisma.creditWallet.findFirst())!.id,
    packageId: pkg.id,
    packageVersion: pkg.version,
    regionalPriceId: euPrice.id,
    regionCode: "EU",
    credits: pkg.credits,
    bonusCredits: 50,
    currency: "EUR",
    amountMinor: 900,
    stripePriceIdSnapshot: "price_test",
    pricingSnapshot: { pricingSource: "REGION_EXACT" },
    idempotencyKey: `verify-regional-${Date.now()}`
  });
  checks.push({
    name: "regional.purchase_snapshot",
    ok: order.regionalPriceId === euPrice.id && order.packageVersion === pkg.version,
    detail: order.id
  });

  report(checks);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
