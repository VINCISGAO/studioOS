import type { Metadata } from "next";
import { SUPPORTED_LANGUAGE_SEEDS } from "@/features/i18n/language.constants";
import type { MarketingLocale } from "@/lib/i18n";
import { marketingDocsMetadata } from "@/lib/marketing/marketing-docs-metadata";
import type { MarketingDocsNavKey } from "@/lib/marketing/marketing-docs-nav";
import { VINCIS_ORGANIZATION, VINCIS_SITE_ORIGIN } from "@/lib/marketing/organization-schema";
import { absoluteBrandLogoUrl } from "@/lib/marketing/site-seo";

const DEFAULT_OG_IMAGE = absoluteBrandLogoUrl();

function marketingCanonical(path: string, locale: MarketingLocale) {
  const base = `${VINCIS_SITE_ORIGIN}${path}`;
  return locale === "zh-CN" ? base : `${base}?lang=${locale}`;
}

function marketingHreflang(path: string) {
  const languages: Record<string, string> = {
    "x-default": `${VINCIS_SITE_ORIGIN}${path}`
  };

  for (const language of SUPPORTED_LANGUAGE_SEEDS) {
    const hreflang = language.code === "zh-CN" ? "zh-CN" : language.code;
    languages[hreflang] =
      language.code === "zh-CN"
        ? `${VINCIS_SITE_ORIGIN}${path}`
        : `${VINCIS_SITE_ORIGIN}${path}?lang=${language.code}`;
  }

  return languages;
}

export function marketingSeoMetadata(
  locale: MarketingLocale,
  page: MarketingDocsNavKey,
  path: string
): Metadata {
  const base = marketingDocsMetadata(locale, page);
  const title = typeof base.title === "string" ? base.title : "VINCIS";
  const description = base.description ?? VINCIS_ORGANIZATION.description;
  const canonical = marketingCanonical(path, locale);

  return {
    ...base,
    openGraph: {
      type: "website",
      siteName: VINCIS_ORGANIZATION.name,
      title,
      description,
      url: canonical,
      images: [{ url: DEFAULT_OG_IMAGE, alt: "VINCIS" }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE]
    },
    alternates: {
      canonical,
      languages: marketingHreflang(path)
    }
  };
}

export function homePageSeoMetadata(locale: MarketingLocale): Metadata {
  const title = "VINCIS | AI Creative Production for Global Brands";
  const description =
    locale === "zh-CN"
      ? "连接全球品牌与智能创意制作的基础设施。"
      : VINCIS_ORGANIZATION.description;
  const canonical = marketingCanonical("/", locale);

  return {
    title,
    description,
    openGraph: {
      type: "website",
      siteName: VINCIS_ORGANIZATION.name,
      title,
      description,
      url: canonical,
      images: [{ url: DEFAULT_OG_IMAGE, alt: "VINCIS" }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE]
    },
    alternates: {
      canonical,
      languages: marketingHreflang("/")
    }
  };
}

export function contactSeoMetadata(locale: MarketingLocale): Metadata {
  const zh = locale === "zh-CN" || locale.startsWith("zh");
  const title = `${zh ? "联系" : "Contact"} | VINCIS`;
  const description = zh ? "联系 VINCIS 团队，开始你的下一个广告 Campaign。" : "Contact the VINCIS team about your next campaign.";
  const canonical = marketingCanonical("/contact", locale);

  return {
    title,
    description,
    openGraph: {
      type: "website",
      siteName: VINCIS_ORGANIZATION.name,
      title,
      description,
      url: canonical,
      images: [{ url: DEFAULT_OG_IMAGE, alt: "VINCIS" }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE]
    },
    alternates: {
      canonical,
      languages: marketingHreflang("/contact")
    }
  };
}

export function creatorProfileSeoMetadata(input: {
  locale: MarketingLocale;
  name: string;
  headline: string;
  profilePath: string;
  image?: string;
}): Metadata {
  const title = `${input.name} | VINCIS Creator`;
  const description = input.headline || `${input.name} on VINCIS`;
  const canonical = marketingCanonical(input.profilePath, input.locale);

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      siteName: VINCIS_ORGANIZATION.name,
      title,
      description,
      url: canonical,
      ...(input.image ? { images: [{ url: input.image, alt: input.name }] } : {})
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(input.image ? { images: [input.image] } : {})
    },
    alternates: {
      canonical,
      languages: marketingHreflang(input.profilePath)
    }
  };
}
