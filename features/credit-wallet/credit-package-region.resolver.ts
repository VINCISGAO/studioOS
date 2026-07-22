import {
  countryToPackageRegion,
  normalizeRegionCode,
  type PackagePricingSource,
  type SupportedPackageRegion
} from "@/lib/credits/regional-package.constants";

export type RegionResolutionInput = {
  billingCountry?: string | null;
  stripeBillingCountry?: string | null;
  selectedRegion?: string | null;
  deploymentCountryHeader?: string | null;
};

export type RegionResolutionResult = {
  regionCode: SupportedPackageRegion;
  source:
    | "billing_country"
    | "stripe_billing"
    | "user_selected"
    | "deployment_header"
    | "global_fallback";
};

export function resolvePackageRegion(input: RegionResolutionInput): RegionResolutionResult {
  if (input.billingCountry?.trim()) {
    return {
      regionCode: countryToPackageRegion(input.billingCountry),
      source: "billing_country"
    };
  }

  if (input.stripeBillingCountry?.trim()) {
    return {
      regionCode: countryToPackageRegion(input.stripeBillingCountry),
      source: "stripe_billing"
    };
  }

  if (input.selectedRegion?.trim()) {
    return {
      regionCode: normalizeRegionCode(input.selectedRegion),
      source: "user_selected"
    };
  }

  if (input.deploymentCountryHeader?.trim()) {
    return {
      regionCode: countryToPackageRegion(input.deploymentCountryHeader),
      source: "deployment_header"
    };
  }

  return {
    regionCode: "GLOBAL",
    source: "global_fallback"
  };
}

export function readTrustedCountryHeader(request?: Request | null): string | null {
  if (!request) return null;
  return (
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-country-code")
  );
}

export function pricingSourceLabel(
  regionCode: SupportedPackageRegion,
  matchedRegion: SupportedPackageRegion
): PackagePricingSource {
  return matchedRegion === regionCode ? "REGION_EXACT" : "GLOBAL_FALLBACK";
}
