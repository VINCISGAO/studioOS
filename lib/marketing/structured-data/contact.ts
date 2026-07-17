import { VINCIS_SITE_ORIGIN, buildOrganizationGraphNode } from "@/lib/marketing/organization-schema";
import { buildBreadcrumbJsonLd } from "@/lib/marketing/structured-data/breadcrumb";
import { buildWebsiteGraphNode } from "@/lib/marketing/structured-data/website";

export function buildContactJsonLdGraph(locale: "en" | "zh", origin = VINCIS_SITE_ORIGIN) {
  const zh = locale === "zh";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...buildOrganizationGraphNode(origin),
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: "hello@vincis.app",
            availableLanguage: ["English", "Chinese"],
            areaServed: "Worldwide"
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
        "@id": `${origin}/contact#contactpage`,
        name: zh ? "联系 VINCIS" : "Contact VINCIS",
        url: `${origin}/contact`,
        mainEntity: { "@id": `${origin}/#organization` }
      }
    ]
  };
}
