import type { MarketingLocale } from "@/lib/i18n";
import { aboutText } from "@/lib/marketing/about-copy";
import { VINCIS_SITE_ORIGIN, buildOrganizationGraphNode } from "@/lib/marketing/organization-schema";
import { buildBreadcrumbJsonLd } from "@/lib/marketing/structured-data/breadcrumb";
import { buildWebsiteGraphNode } from "@/lib/marketing/structured-data/website";

export function buildAboutJsonLdGraph(locale: MarketingLocale, origin = VINCIS_SITE_ORIGIN) {
  const copy = aboutText(locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...buildOrganizationGraphNode(origin),
        description: copy.hero.paragraphs[0],
        foundingDate: "2024",
        knowsAbout: copy.hero.features.map((item) => item.title)
      },
      buildWebsiteGraphNode(origin),
      buildBreadcrumbJsonLd(
        [
          { name: "Home", path: "/" },
          { name: copy.pageTitle, path: "/about" }
        ],
        origin
      )
    ]
  };
}
