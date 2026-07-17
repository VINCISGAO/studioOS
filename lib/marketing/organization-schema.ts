export const VINCIS_SITE_ORIGIN = "https://vincis.app" as const;
export const VINCIS_BRAND_LOGO_PATH = "/brand/vincis-logo-512.png" as const;

export const VINCIS_ORGANIZATION = {
  name: "VINCIS",
  url: VINCIS_SITE_ORIGIN,
  logo: `${VINCIS_SITE_ORIGIN}${VINCIS_BRAND_LOGO_PATH}`,
  description:
    "VINCIS is an AI-powered advertising production platform connecting global brands with AI creators.",
  sameAs: [
    "https://www.linkedin.com/company/vincis",
    "https://x.com/vincis",
    "https://www.youtube.com/@vincis"
  ] as const
} as const;

function logoImageObject(origin: string) {
  return {
    "@type": "ImageObject",
    url: `${origin.replace(/\/$/u, "")}${VINCIS_BRAND_LOGO_PATH}`
  };
}

/** Standalone Organization JSON-LD for legacy callers. Prefer homepage graph builders. */
export function buildOrganizationJsonLd(origin: string = VINCIS_SITE_ORIGIN) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: VINCIS_ORGANIZATION.name,
    url: VINCIS_ORGANIZATION.url,
    logo: logoImageObject(origin),
    image: logoImageObject(origin),
    description: VINCIS_ORGANIZATION.description,
    sameAs: [...VINCIS_ORGANIZATION.sameAs]
  };
}

/** Organization node for multi-entity JSON-LD graphs. */
export function buildOrganizationGraphNode(origin: string = VINCIS_SITE_ORIGIN) {
  return {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: VINCIS_ORGANIZATION.name,
    url: origin,
    logo: logoImageObject(origin),
    image: logoImageObject(origin),
    description: VINCIS_ORGANIZATION.description,
    sameAs: [...VINCIS_ORGANIZATION.sameAs]
  };
}
