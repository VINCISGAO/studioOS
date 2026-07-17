import { VINCIS_SITE_ORIGIN } from "@/lib/marketing/organization-schema";

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
  origin = VINCIS_SITE_ORIGIN
) {
  const canonicalItems = items.length
    ? items
    : [{ name: "Home", path: "/" }];

  return {
    "@type": "BreadcrumbList",
    itemListElement: canonicalItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path.startsWith("http") ? item.path : `${origin}${item.path}`
    }))
  };
}
