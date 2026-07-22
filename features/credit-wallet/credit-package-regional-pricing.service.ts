import type { AuthUserDto } from "@/features/auth/auth.service";
import {
  creditPackageRegionalPricingRepository,
  type ResolvedRegionalPackagePrice
} from "@/features/credit-wallet/credit-package-regional-pricing.repository";
import {
  pricingSourceLabel,
  readTrustedCountryHeader,
  resolvePackageRegion,
  type RegionResolutionInput
} from "@/features/credit-wallet/credit-package-region.resolver";
import { creditWalletRepository } from "@/features/credit-wallet/credit-wallet.repository";
import { formatAmountMinor, validateAmountMinor } from "@/lib/credits/currency-minor-units";
import {
  MAX_CUSTOM_CREDIT_PURCHASE,
  MIN_CUSTOM_CREDIT_PURCHASE
} from "@/lib/credits/custom-purchase.constants";
import {
  intlLocaleForCurrency,
  uiLocaleToPackageRegion,
  USD_CNY_DISPLAY_RATE
} from "@/lib/credits/market-currency";
import {
  normalizeRegionCode,
  type SupportedPackageRegion
} from "@/lib/credits/regional-package.constants";
import type { Locale } from "@/lib/i18n";
import { appError } from "@/lib/core/errors";
import { prisma } from "@/lib/core/database/prisma";

export type ResolvedPackageQuoteView = {
  packageId: string;
  packageName: string;
  packageVersion: number;
  regionCode: SupportedPackageRegion;
  matchedRegion: SupportedPackageRegion;
  regionSource: ReturnType<typeof resolvePackageRegion>["source"];
  pricingSource: "REGION_EXACT" | "GLOBAL_FALLBACK";
  currency: string;
  amountMinor: number;
  displayAmount: string;
  baseCredits: number;
  bonusCredits: number;
  totalCredits: number;
  regionalPriceId: string;
  regionalPriceVersion: number;
  stripePriceId: string | null;
  globalFallbackUsed: boolean;
  quotedAt: string;
};

export type CreditCustomPurchaseTerms = {
  minCredits: number;
  maxCredits: number;
  currency: string;
  referencePackageName: string;
  referenceBaseCredits: number;
  referenceAmountMinor: number;
  displayUnitPrice: string;
};

function assertCustomCreditAmount(customCredits: number) {
  const credits = Math.floor(customCredits);
  if (!Number.isFinite(credits) || credits < MIN_CUSTOM_CREDIT_PURCHASE || credits > MAX_CUSTOM_CREDIT_PURCHASE) {
    throw appError(
      "VALIDATION_ERROR",
      `Custom purchase must be between ${MIN_CUSTOM_CREDIT_PURCHASE} and ${MAX_CUSTOM_CREDIT_PURCHASE} Token`
    );
  }
  return credits;
}

function computeCustomAmountMinor(customCredits: number, referenceCredits: number, referenceAmountMinor: number) {
  return Math.max(1, Math.round((customCredits / referenceCredits) * referenceAmountMinor));
}

function buildCustomPurchaseTerms(
  packages: Array<{
    name: string;
    credits: number;
    currency: string;
    amountMinor: number;
  }>,
  uiLocale?: Locale | null
): CreditCustomPurchaseTerms | null {
  const reference = [...packages].sort((a, b) => a.credits - b.credits)[0];
  if (!reference) return null;

  const unitMinor = reference.amountMinor / reference.credits;
  return {
    minCredits: MIN_CUSTOM_CREDIT_PURCHASE,
    maxCredits: MAX_CUSTOM_CREDIT_PURCHASE,
    currency: reference.currency,
    referencePackageName: reference.name,
    referenceBaseCredits: reference.credits,
    referenceAmountMinor: reference.amountMinor,
    displayUnitPrice: formatAmountMinor(
      reference.currency,
      Math.max(1, Math.round(unitMinor)),
      intlLocaleForCurrency(reference.currency, uiLocale)
    )
  };
}

function buildQuoteView(
  resolved: ResolvedRegionalPackagePrice,
  uiLocale?: Locale | null
): ResolvedPackageQuoteView {
  return {
    packageId: resolved.package.id,
    packageName: resolved.package.name,
    packageVersion: resolved.package.version,
    regionCode: resolved.requestedRegion,
    matchedRegion: resolved.matchedRegion,
    regionSource: "global_fallback",
    pricingSource: resolved.pricingSource,
    currency: resolved.currency,
    amountMinor: resolved.amountMinor,
    displayAmount: formatAmountMinor(
      resolved.currency,
      resolved.amountMinor,
      intlLocaleForCurrency(resolved.currency, uiLocale)
    ),
    baseCredits: resolved.baseCredits,
    bonusCredits: resolved.bonusCredits,
    totalCredits: resolved.totalCredits,
    regionalPriceId: resolved.regionalPrice.id,
    regionalPriceVersion: resolved.regionalPrice.version,
    stripePriceId: resolved.stripePriceId,
    globalFallbackUsed: resolved.pricingSource === "GLOBAL_FALLBACK",
    quotedAt: resolved.quotedAt
  };
}

async function loadBillingCountry(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { country: true }
  });
  return user?.country ?? null;
}

async function ensureCnRegionalPrices(now = new Date()) {
  const packages = await creditWalletRepository.listActivePackages(now);
  for (const pkg of packages) {
    const existing = await creditPackageRegionalPricingRepository.findEffectiveForRegion({
      packageId: pkg.id,
      regionCode: "CN",
      now
    });
    if (existing) continue;

    const global =
      (await creditPackageRegionalPricingRepository.findEffectiveForRegion({
        packageId: pkg.id,
        regionCode: "GLOBAL",
        now
      })) ??
      (await creditPackageRegionalPricingRepository.findGlobalFallback({
        packageId: pkg.id,
        now
      }));

    const baseMinor = global?.amountMinor ?? pkg.amountMinor;
    const baseCurrency = global?.currency ?? pkg.currency;
    const cnyMinor =
      baseCurrency.toUpperCase() === "USD"
        ? Math.max(100, Math.round((baseMinor / 100) * USD_CNY_DISPLAY_RATE * 100))
        : baseMinor;

    await creditPackageRegionalPricingRepository.create({
      package: { connect: { id: pkg.id } },
      regionCode: "CN",
      currency: "CNY",
      amountMinor: cnyMinor,
      bonusCredits: global?.bonusCredits ?? pkg.bonusCredits,
      enabled: true,
      version: 1,
      startsAt: null,
      endsAt: null
    });
  }
}

export const creditPackageRegionalPricingService = {
  async resolveRegionForRequest(
    user: AuthUserDto | null,
    request?: Request | null,
    selectedRegion?: string | null,
    uiLocale?: Locale | null
  ) {
    const localeRegion = uiLocaleToPackageRegion(uiLocale);
    const resolutionInput: RegionResolutionInput = {
      billingCountry: user ? await loadBillingCountry(user.id) : null,
      selectedRegion: selectedRegion ?? (localeRegion ? localeRegion : null),
      deploymentCountryHeader: readTrustedCountryHeader(request)
    };
    return resolvePackageRegion(resolutionInput);
  },

  async resolvePackageQuote(input: {
    packageId: string;
    requestedRegion: SupportedPackageRegion;
    now?: Date;
  }): Promise<ResolvedRegionalPackagePrice> {
    const pkg = await creditWalletRepository.findActivePackageById(input.packageId, input.now);
    if (!pkg) {
      throw appError("NOT_FOUND", "Credit package not found or unavailable");
    }

    const exact = await creditPackageRegionalPricingRepository.findEffectiveForRegion({
      packageId: pkg.id,
      regionCode: input.requestedRegion,
      now: input.now
    });

    if (exact) {
      validateAmountMinor(exact.currency, exact.amountMinor);
      const bonusCredits = exact.bonusCredits > 0 ? exact.bonusCredits : pkg.bonusCredits;
      return {
        package: pkg,
        regionalPrice: exact,
        matchedRegion: input.requestedRegion,
        requestedRegion: input.requestedRegion,
        pricingSource: "REGION_EXACT",
        baseCredits: pkg.credits,
        bonusCredits,
        totalCredits: pkg.credits + bonusCredits,
        currency: exact.currency,
        amountMinor: exact.amountMinor,
        stripePriceId: exact.stripePriceId,
        quotedAt: new Date().toISOString()
      };
    }

    if (input.requestedRegion !== "GLOBAL") {
      const fallback = await creditPackageRegionalPricingRepository.findGlobalFallback({
        packageId: pkg.id,
        now: input.now
      });
      if (fallback) {
        validateAmountMinor(fallback.currency, fallback.amountMinor);
        const bonusCredits = fallback.bonusCredits > 0 ? fallback.bonusCredits : pkg.bonusCredits;
        return {
          package: pkg,
          regionalPrice: fallback,
          matchedRegion: "GLOBAL",
          requestedRegion: input.requestedRegion,
          pricingSource: "GLOBAL_FALLBACK",
          baseCredits: pkg.credits,
          bonusCredits,
          totalCredits: pkg.credits + bonusCredits,
          currency: fallback.currency,
          amountMinor: fallback.amountMinor,
          stripePriceId: fallback.stripePriceId,
          quotedAt: new Date().toISOString()
        };
      }
    }

    throw appError("PACKAGE_PRICE_UNAVAILABLE", "No active regional price is configured for this package");
  },

  async quoteForUser(input: {
    user: AuthUserDto | null;
    packageId: string;
    request?: Request | null;
    selectedRegion?: string | null;
    uiLocale?: Locale | null;
  }): Promise<ResolvedPackageQuoteView> {
    const regionResolution = await this.resolveRegionForRequest(
      input.user,
      input.request,
      input.selectedRegion,
      input.uiLocale
    );
    if (regionResolution.regionCode === "CN") {
      await ensureCnRegionalPrices();
    }
    const resolved = await this.resolvePackageQuote({
      packageId: input.packageId,
      requestedRegion: regionResolution.regionCode
    });
    return {
      ...buildQuoteView(resolved, input.uiLocale),
      regionSource: regionResolution.source,
      pricingSource: pricingSourceLabel(regionResolution.regionCode, resolved.matchedRegion)
    };
  },

  async listPackagesForUser(input: {
    user: AuthUserDto | null;
    request?: Request | null;
    selectedRegion?: string | null;
    uiLocale?: Locale | null;
  }) {
    const regionResolution = await this.resolveRegionForRequest(
      input.user,
      input.request,
      input.selectedRegion,
      input.uiLocale
    );
    const packages = await creditWalletRepository.listActivePackages();
    const resolvedRegion = normalizeRegionCode(input.selectedRegion ?? regionResolution.regionCode);
    if (resolvedRegion === "CN") {
      await ensureCnRegionalPrices();
    }

    const quotes = await Promise.all(
      packages.map(async (pkg) => {
        try {
          const quote = await this.resolvePackageQuote({
            packageId: pkg.id,
            requestedRegion: resolvedRegion
          });
          return buildQuoteView(
            {
              ...quote,
              requestedRegion: resolvedRegion
            },
            input.uiLocale
          );
        } catch {
          return null;
        }
      })
    );

    return {
      regionCode: resolvedRegion,
      regionSource: regionResolution.source,
      packages: quotes
        .filter((quote): quote is ResolvedPackageQuoteView => quote !== null)
        .map((quote) => ({
          id: quote.packageId,
          name: quote.packageName,
          credits: quote.baseCredits,
          bonusCredits: quote.bonusCredits,
          totalCredits: quote.totalCredits,
          currency: quote.currency,
          amountMinor: quote.amountMinor,
          displayPrice: quote.displayAmount,
          regionCode: quote.regionCode,
          matchedRegion: quote.matchedRegion,
          pricingSource: quote.pricingSource,
          globalFallbackUsed: quote.globalFallbackUsed,
          regionalPriceId: quote.regionalPriceId,
          stripePriceId: quote.stripePriceId
        }))
    };
  },

  async getCustomPurchaseTerms(input: {
    user: AuthUserDto | null;
    request?: Request | null;
    selectedRegion?: string | null;
    uiLocale?: Locale | null;
  }): Promise<CreditCustomPurchaseTerms | null> {
    const catalog = await this.listPackagesForUser(input);
    return buildCustomPurchaseTerms(catalog.packages, input.uiLocale);
  },

  getCustomPurchaseTermsFromPackages(
    packages: Array<{
      name: string;
      credits: number;
      currency: string;
      amountMinor: number;
    }>,
    uiLocale?: Locale | null
  ): CreditCustomPurchaseTerms | null {
    return buildCustomPurchaseTerms(packages, uiLocale);
  },

  async quoteCustomCreditsForUser(input: {
    user: AuthUserDto | null;
    customCredits: number;
    request?: Request | null;
    selectedRegion?: string | null;
    uiLocale?: Locale | null;
  }): Promise<ResolvedPackageQuoteView & { purchaseKind: "custom"; referencePackageId: string }> {
    const customCredits = assertCustomCreditAmount(input.customCredits);
    const catalog = await this.listPackagesForUser(input);
    const reference = [...catalog.packages].sort((a, b) => a.credits - b.credits)[0];
    if (!reference) {
      throw appError("NOT_FOUND", "No credit packages available");
    }

    const amountMinor = computeCustomAmountMinor(
      customCredits,
      reference.credits,
      reference.amountMinor
    );
    validateAmountMinor(reference.currency, amountMinor);

    return {
      packageId: reference.id,
      packageName: input.uiLocale === "zh" ? "自定义数量" : "Custom amount",
      packageVersion: 0,
      regionCode: reference.regionCode,
      matchedRegion: reference.matchedRegion,
      regionSource: catalog.regionSource,
      pricingSource: reference.pricingSource,
      currency: reference.currency,
      amountMinor,
      displayAmount: formatAmountMinor(
        reference.currency,
        amountMinor,
        intlLocaleForCurrency(reference.currency, input.uiLocale)
      ),
      baseCredits: customCredits,
      bonusCredits: 0,
      totalCredits: customCredits,
      regionalPriceId: reference.regionalPriceId,
      regionalPriceVersion: 0,
      stripePriceId: null,
      globalFallbackUsed: reference.globalFallbackUsed,
      quotedAt: new Date().toISOString(),
      purchaseKind: "custom",
      referencePackageId: reference.id
    };
  }
};
