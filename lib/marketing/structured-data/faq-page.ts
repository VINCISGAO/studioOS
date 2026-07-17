import type { MarketingLocale } from "@/lib/i18n";
import { faqText } from "@/lib/marketing/faq-copy";
import { VINCIS_SITE_ORIGIN, buildOrganizationGraphNode } from "@/lib/marketing/organization-schema";
import { buildBreadcrumbJsonLd } from "@/lib/marketing/structured-data/breadcrumb";
import { buildWebsiteGraphNode } from "@/lib/marketing/structured-data/website";

export function buildMarketingFaqJsonLdGraph(locale: MarketingLocale, origin = VINCIS_SITE_ORIGIN) {
  const copy = faqText(locale);
  const questions = copy.categories.flatMap((category) => category.items);

  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationGraphNode(origin),
      buildWebsiteGraphNode(origin),
      buildBreadcrumbJsonLd(
        [
          { name: "Home", path: "/" },
          { name: copy.hero.eyebrow, path: "/faq" }
        ],
        origin
      ),
      {
        "@type": "FAQPage",
        "@id": `${origin}/faq#faq`,
        mainEntity: questions.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: [item.answer, ...(item.bullets ?? [])].filter(Boolean).join("\n")
          }
        }))
      }
    ]
  };
}
