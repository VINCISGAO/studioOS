import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { aboutText } from "@/lib/marketing/about-copy";
import { casesCopy } from "@/lib/marketing/cases-copy";
import { faqText } from "@/lib/marketing/faq-copy";
import type { MarketingDocsNavKey } from "@/lib/marketing/marketing-docs-nav";
import { partnersText } from "@/lib/marketing/partners-copy";
import { pricingText } from "@/lib/marketing/pricing-copy";
import { processText } from "@/lib/marketing/process-copy";

const SITE = "VINCIS";

export function marketingDocsMetadata(locale: Locale, page: MarketingDocsNavKey): Metadata {
  if (page === "about") {
    const copy = aboutText(locale);
    return {
      title: `${copy.hero.title} | ${SITE}`,
      description: copy.hero.paragraphs[0]
    };
  }

  if (page === "process") {
    const copy = processText(locale);
    return {
      title: `${copy.pageTitle} | ${SITE}`,
      description: copy.subtitle
    };
  }

  if (page === "cases") {
    const copy = casesCopy(locale);
    return {
      title: `${copy.title} | ${SITE}`,
      description: copy.subtitle
    };
  }

  if (page === "pricing") {
    const copy = pricingText(locale);
    return {
      title: `${copy.title} ${copy.titleAccent} | ${SITE}`,
      description: copy.intro
    };
  }

  if (page === "resources") {
    const copy = partnersText(locale);
    return {
      title: `${copy.hero.titleLead} | ${SITE}`,
      description: copy.hero.body
    };
  }

  const faq = faqText(locale);
  return {
    title: `${faq.hero.title} | ${SITE}`,
    description: faq.hero.subtitle
  };
}
