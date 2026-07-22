export const SUPPORTED_PACKAGE_REGIONS = ["GLOBAL", "US", "CN", "EU", "GB", "JP", "KR"] as const;

export type SupportedPackageRegion = (typeof SUPPORTED_PACKAGE_REGIONS)[number];

export const REGION_CURRENCY_DEFAULTS: Record<SupportedPackageRegion, string> = {
  GLOBAL: "USD",
  US: "USD",
  CN: "CNY",
  EU: "EUR",
  GB: "GBP",
  JP: "JPY",
  KR: "KRW"
};

export const EU_COUNTRY_CODES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE"
]);

export type PackagePricingSource = "REGION_EXACT" | "GLOBAL_FALLBACK";

export function normalizeRegionCode(value: string | null | undefined): SupportedPackageRegion {
  const code = String(value ?? "GLOBAL")
    .trim()
    .toUpperCase();
  if (code === "UK") return "GB";
  if ((SUPPORTED_PACKAGE_REGIONS as readonly string[]).includes(code)) {
    return code as SupportedPackageRegion;
  }
  return "GLOBAL";
}

export function countryToPackageRegion(country: string | null | undefined): SupportedPackageRegion {
  const code = String(country ?? "")
    .trim()
    .toUpperCase();
  if (!code) return "GLOBAL";
  if (code === "US") return "US";
  if (code === "CN") return "CN";
  if (code === "GB" || code === "UK") return "GB";
  if (code === "JP") return "JP";
  if (code === "KR") return "KR";
  if (EU_COUNTRY_CODES.has(code)) return "EU";
  return "GLOBAL";
}

export function defaultCurrencyForRegion(region: SupportedPackageRegion): string {
  return REGION_CURRENCY_DEFAULTS[region];
}
