import type { CreditPackage, CreditPackageRegionalPrice, Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/database/prisma";
import type { SupportedPackageRegion } from "@/lib/credits/regional-package.constants";

function effectiveWindow(now: Date): Prisma.CreditPackageRegionalPriceWhereInput {
  return {
    enabled: true,
    OR: [{ startsAt: null }, { startsAt: { lte: now } }],
    AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }]
  };
}

export const creditPackageRegionalPricingRepository = {
  listForPackage(packageId: string, includeDisabled = false) {
    return prisma.creditPackageRegionalPrice.findMany({
      where: {
        packageId,
        ...(includeDisabled ? {} : { enabled: true })
      },
      orderBy: [{ regionCode: "asc" }, { version: "desc" }]
    });
  },

  findById(priceId: string) {
    return prisma.creditPackageRegionalPrice.findUnique({ where: { id: priceId } });
  },

  findEffectiveForRegion(input: {
    packageId: string;
    regionCode: SupportedPackageRegion;
    now?: Date;
  }) {
    const now = input.now ?? new Date();
    return prisma.creditPackageRegionalPrice.findFirst({
      where: {
        packageId: input.packageId,
        regionCode: input.regionCode,
        ...effectiveWindow(now)
      },
      orderBy: [{ version: "desc" }, { updatedAt: "desc" }]
    });
  },

  findGlobalFallback(input: { packageId: string; now?: Date }) {
    return this.findEffectiveForRegion({
      packageId: input.packageId,
      regionCode: "GLOBAL",
      now: input.now
    });
  },

  create(data: Prisma.CreditPackageRegionalPriceCreateInput) {
    return prisma.creditPackageRegionalPrice.create({ data });
  },

  update(priceId: string, data: Prisma.CreditPackageRegionalPriceUpdateInput) {
    return prisma.creditPackageRegionalPrice.update({ where: { id: priceId }, data });
  }
};

export type ResolvedRegionalPackagePrice = {
  package: CreditPackage;
  regionalPrice: CreditPackageRegionalPrice;
  matchedRegion: SupportedPackageRegion;
  requestedRegion: SupportedPackageRegion;
  pricingSource: "REGION_EXACT" | "GLOBAL_FALLBACK";
  baseCredits: number;
  bonusCredits: number;
  totalCredits: number;
  currency: string;
  amountMinor: number;
  stripePriceId: string | null;
  quotedAt: string;
};
