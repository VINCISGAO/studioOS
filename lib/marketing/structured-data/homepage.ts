import { VINCIS_SITE_ORIGIN, buildOrganizationGraphNode } from "@/lib/marketing/organization-schema";
import { buildBreadcrumbJsonLd } from "@/lib/marketing/structured-data/breadcrumb";
import { buildWebsiteGraphNode } from "@/lib/marketing/structured-data/website";

export function buildHomepageJsonLdGraph(origin = VINCIS_SITE_ORIGIN) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationGraphNode(origin),
      buildWebsiteGraphNode(origin),
      buildBreadcrumbJsonLd([{ name: "Home", path: "/" }], origin)
    ]
  };
}
