import type { MarketingLocale } from "@/lib/i18n";
import { isChineseMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";
import { VINCIS_SITE_ORIGIN, buildOrganizationGraphNode } from "@/lib/marketing/organization-schema";
import { buildBreadcrumbJsonLd } from "@/lib/marketing/structured-data/breadcrumb";
import { buildWebsiteGraphNode } from "@/lib/marketing/structured-data/website";

export function buildContactJsonLdGraph(locale: MarketingLocale, origin = VINCIS_SITE_ORIGIN) {
  const zh = isChineseMarketingLocale(locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...buildOrganizationGraphNode(origin),
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: zh ? "客户服务" : "customer support",
            email: "hello@vincis.app",
            availableLanguage: ["English", "Chinese"]
          }
        ]
      },
      buildWebsiteGraphNode(origin),
      buildBreadcrumbJsonLd(
        [
          { name: "Home", path: "/" },
          { name: zh ? "联系" : "Contact", path: "/contact" }
        ],
        origin
      ),
      {
        "@type": "ContactPage",
        "@id": `${origin}/contact#webpage`,
        name: zh ? "联系 VINCIS" : "Contact VINCIS",
        url: `${origin}/contact`
      }
    ]
  };
}
