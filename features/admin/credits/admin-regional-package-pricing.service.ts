import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { creditPlatformAuditService } from "@/features/admin/credits/credit-platform-audit.service";
import { creditPackageRegionalPricingRepository } from "@/features/credit-wallet/credit-package-regional-pricing.repository";
import { creditPackageRegionalPricingService } from "@/features/credit-wallet/credit-package-regional-pricing.service";
import {
  defaultCurrencyForRegion,
  normalizeRegionCode,
  SUPPORTED_PACKAGE_REGIONS
} from "@/lib/credits/regional-package.constants";
import { formatAmountMinor, validateAmountMinor } from "@/lib/credits/currency-minor-units";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

type RegionalPriceInput = {
  regionCode: string;
  currency?: string;
  amountMinor: number;
  bonusCredits?: number;
  stripePriceId?: string | null;
  enabled?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  taxBehavior?: string | null;
};

function serializeRegionalPrice(row: {
  id: string;
  packageId: string;
  regionCode: string;
  currency: string;
  amountMinor: number;
  bonusCredits: number;
  stripePriceId: string | null;
  enabled: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  taxBehavior: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    packageId: row.packageId,
    regionCode: row.regionCode,
    currency: row.currency,
    amountMinor: row.amountMinor,
    displayAmount: formatAmountMinor(row.currency, row.amountMinor),
    bonusCredits: row.bonusCredits,
    stripePriceId: row.stripePriceId,
    active: row.enabled,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    taxBehavior: row.taxBehavior,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export class AdminRegionalPackagePricingService {
  private assertAccess(user: AuthUser) {
    PermissionService.assert(user, "admin.wallet.manage");
    if (!hasDatabaseUrl()) return false;
    return true;
  }

  async list(user: AuthUser, packageId: string) {
    if (!this.assertAccess(user)) return null;
    const pkg = await prisma.creditPackage.findFirst({ where: { id: packageId, deletedAt: null } });
    if (!pkg) return null;
    const rows = await creditPackageRegionalPricingRepository.listForPackage(packageId, true);
    const audit = await creditPlatformAuditService.list({
      entityType: "CREDIT_PACKAGE_REGIONAL_PRICE",
      entityId: packageId,
      limit: 30
    });
    return {
      package: {
        id: pkg.id,
        name: pkg.name,
        version: pkg.version,
        credits: pkg.credits,
        bonusCredits: pkg.bonusCredits,
        enabled: pkg.enabled,
        visible: pkg.visible
      },
      regionalPrices: rows.map(serializeRegionalPrice),
      audit
    };
  }

  async preview(user: AuthUser, packageId: string, regionCode: string) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const quote = await creditPackageRegionalPricingService.resolvePackageQuote({
      packageId,
      requestedRegion: normalizeRegionCode(regionCode)
    });
    return {
      regionCode: normalizeRegionCode(regionCode),
      matchedRegion: quote.matchedRegion,
      pricingSource: quote.pricingSource,
      currency: quote.currency,
      amountMinor: quote.amountMinor,
      displayAmount: formatAmountMinor(quote.currency, quote.amountMinor),
      baseCredits: quote.baseCredits,
      bonusCredits: quote.bonusCredits,
      totalCredits: quote.totalCredits,
      stripePriceId: quote.stripePriceId
    };
  }

  async validateFallback(user: AuthUser, packageId: string) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const global = await creditPackageRegionalPricingRepository.findGlobalFallback({ packageId });
    const issues: Array<{ code: string; message: string; severity: "error" | "warning" }> = [];
    if (!global) {
      issues.push({
        code: "missing_global",
        message: "GLOBAL fallback price is required",
        severity: "error"
      });
    } else if (!global.enabled) {
      issues.push({
        code: "global_disabled",
        message: "GLOBAL fallback price is disabled",
        severity: "error"
      });
    }
    for (const region of SUPPORTED_PACKAGE_REGIONS) {
      if (region === "GLOBAL") continue;
      const row = await creditPackageRegionalPricingRepository.findEffectiveForRegion({
        packageId,
        regionCode: region
      });
      if (!row) {
        issues.push({
          code: `missing_${region.toLowerCase()}`,
          message: `${region} price is not configured — checkout will fall back to GLOBAL`,
          severity: "warning"
        });
      }
    }
    return { ok: issues.every((issue) => issue.severity !== "error"), issues };
  }

  async create(user: AuthUser, packageId: string, input: RegionalPriceInput) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const pkg = await prisma.creditPackage.findFirst({ where: { id: packageId, deletedAt: null } });
    if (!pkg) throw appError("NOT_FOUND", "Credit package not found");

    const regionCode = normalizeRegionCode(input.regionCode);
    const currency = (input.currency ?? defaultCurrencyForRegion(regionCode)).toUpperCase();
    validateAmountMinor(currency, input.amountMinor);

    const latest = await prisma.creditPackageRegionalPrice.findFirst({
      where: { packageId, regionCode, currency },
      orderBy: { version: "desc" }
    });
    const version = (latest?.version ?? 0) + 1;

    const row = await creditPackageRegionalPricingRepository.create({
      package: { connect: { id: packageId } },
      regionCode,
      currency,
      amountMinor: input.amountMinor,
      bonusCredits: input.bonusCredits ?? 0,
      stripePriceId: input.stripePriceId ?? null,
      enabled: input.enabled ?? true,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      taxBehavior: input.taxBehavior ?? null,
      version
    });

    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: "regional_price.created",
      entityType: "CREDIT_PACKAGE_REGIONAL_PRICE",
      entityId: row.id,
      metadata: { packageId, regionCode, currency, version }
    });

    return serializeRegionalPrice(row);
  }

  async update(user: AuthUser, packageId: string, priceId: string, input: Partial<RegionalPriceInput>) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const existing = await prisma.creditPackageRegionalPrice.findFirst({
      where: { id: priceId, packageId }
    });
    if (!existing) throw appError("NOT_FOUND", "Regional price not found");

    const currency = (input.currency ?? existing.currency).toUpperCase();
    const amountMinor = input.amountMinor ?? existing.amountMinor;
    validateAmountMinor(currency, amountMinor);

    const row = await creditPackageRegionalPricingRepository.update(priceId, {
      currency,
      amountMinor,
      bonusCredits: input.bonusCredits,
      stripePriceId: input.stripePriceId,
      enabled: input.enabled,
      startsAt: input.startsAt === undefined ? undefined : input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt === undefined ? undefined : input.endsAt ? new Date(input.endsAt) : null,
      taxBehavior: input.taxBehavior,
      version: existing.version + 1
    });

    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: input.enabled === false ? "regional_price.disabled" : "regional_price.updated",
      entityType: "CREDIT_PACKAGE_REGIONAL_PRICE",
      entityId: row.id,
      metadata: { packageId, ...input, version: row.version }
    });

    return serializeRegionalPrice(row);
  }

  async duplicate(user: AuthUser, packageId: string, priceId: string, targetRegionCode: string) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const source = await prisma.creditPackageRegionalPrice.findFirst({
      where: { id: priceId, packageId }
    });
    if (!source) throw appError("NOT_FOUND", "Regional price not found");
    return this.create(user, packageId, {
      regionCode: targetRegionCode,
      currency: source.currency,
      amountMinor: source.amountMinor,
      bonusCredits: source.bonusCredits,
      stripePriceId: source.stripePriceId,
      enabled: false,
      startsAt: source.startsAt?.toISOString() ?? null,
      endsAt: source.endsAt?.toISOString() ?? null,
      taxBehavior: source.taxBehavior
    });
  }

  async setStripePrice(user: AuthUser, packageId: string, priceId: string, stripePriceId: string | null) {
    return this.update(user, packageId, priceId, { stripePriceId });
  }
}

export const adminRegionalPackagePricingService = new AdminRegionalPackagePricingService();
