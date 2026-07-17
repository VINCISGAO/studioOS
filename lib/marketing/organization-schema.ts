export const VINCIS_SITE_ORIGIN = "https://vincis.app" as const;

export const VINCIS_ORGANIZATION = {
  name: "VINCIS",
  url: VINCIS_SITE_ORIGIN,
  logo: `${VINCIS_SITE_ORIGIN}/logo.png`,
  description:
    "AI-powered advertising production platform connecting global brands with creators.",
  sameAs: [
    "https://www.linkedin.com/company/vincis",
    "https://x.com/vincis",
    "https://www.youtube.com/@vincis"
  ] as const
} as const;

/** Standalone Organization JSON-LD for the marketing homepage. */
export function buildOrganizationJsonLd(origin: string = VINCIS_SITE_ORIGIN) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: VINCIS_ORGANIZATION.name,
    url: VINCIS_ORGANIZATION.url,
    logo: `${origin.replace(/\/$/u, "")}/logo.png`,
    description: VINCIS_ORGANIZATION.description,
    sameAs: [...VINCIS_ORGANIZATION.sameAs]
  };
}

/** Organization node for multi-entity JSON-LD graphs (e.g. knowledge articles). */
export function buildOrganizationGraphNode(origin: string = VINCIS_SITE_ORIGIN) {
  return {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: VINCIS_ORGANIZATION.name,
    url: origin,
    logo: `${origin.replace(/\/$/u, "")}/logo.png`,
    description: VINCIS_ORGANIZATION.description,
    sameAs: [...VINCIS_ORGANIZATION.sameAs]
  };
}
