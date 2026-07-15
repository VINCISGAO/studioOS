import { MARKETING_SITE_NAV_PATHS, type MarketingSiteNavKey } from "@/lib/marketing/marketing-site-nav";

const PATH_TO_ACTIVE = Object.entries(MARKETING_SITE_NAV_PATHS).reduce(
  (map, [key, path]) => {
    map.set(path, key as MarketingSiteNavKey);
    return map;
  },
  new Map<string, MarketingSiteNavKey>()
);

export function resolveMarketingDocsActive(pathname: string): MarketingSiteNavKey {
  const normalized = pathname.split("?")[0]?.replace(/\/$/, "") || "/";
  return PATH_TO_ACTIVE.get(normalized) ?? "about";
}
