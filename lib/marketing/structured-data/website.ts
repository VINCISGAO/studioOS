import { KNOWLEDGE_CENTER_PATH_SEGMENT } from "@/features/knowledge-center/knowledge-center.constants";
import { VINCIS_ORGANIZATION, VINCIS_SITE_ORIGIN } from "@/lib/marketing/organization-schema";

export function buildWebsiteSearchAction(origin: string, pathPrefix = "en") {
  return {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${origin}/${pathPrefix}/${KNOWLEDGE_CENTER_PATH_SEGMENT}?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  };
}

export function buildWebsiteGraphNode(origin: string = VINCIS_SITE_ORIGIN, pathPrefix = "en") {
  return {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name: VINCIS_ORGANIZATION.name,
    description: VINCIS_ORGANIZATION.description,
    publisher: { "@id": `${origin}/#organization` },
    inLanguage: ["en", "zh-CN"],
    potentialAction: buildWebsiteSearchAction(origin, pathPrefix)
  };
}
