import type { Locale } from "@/lib/i18n";
import { pricingText } from "@/lib/marketing/pricing-copy";
import { VINCIS_SITE_ORIGIN, buildOrganizationGraphNode } from "@/lib/marketing/organization-schema";
import { buildBreadcrumbJsonLd } from "@/lib/marketing/structured-data/breadcrumb";
import { buildWebsiteGraphNode } from "@/lib/marketing/structured-data/website";

export function buildPricingJsonLdGraph(locale: Locale, origin = VINCIS_SITE_ORIGIN) {
  const copy = pricingText(locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationGraphNode(origin),
      buildWebsiteGraphNode(origin),
      buildBreadcrumbJsonLd(
        [
          { name: "Home", path: "/" },
          { name: copy.eyebrow, path: "/pricing" }
        ],
        origin
      ),
      {
        "@type": "Product",
        "@id": `${origin}/pricing#product`,
        name: "VINCIS Ad Production Platform",
        description: copy.intro,
        brand: { "@id": `${origin}/#organization` },
        category: "Advertising Production Platform",
        offers: {
          "@type": "AggregateOffer",
          offerCount: copy.budgetTiers.length,
          priceCurrency: "USD",
          seller: { "@id": `${origin}/#organization` },
          offers: copy.budgetTiers.map((tier) => ({
            "@type": "Offer",
            name: tier.title,
            description: [tier.subtitle, tier.audience, ...tier.features].join(" · "),
            seller: { "@id": `${origin}/#organization` },
            availability: "https://schema.org/InStock"
          }))
        }
      }
    ]
  };
}
