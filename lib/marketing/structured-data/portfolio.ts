import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import { VINCIS_SITE_ORIGIN, buildOrganizationGraphNode } from "@/lib/marketing/organization-schema";
import { buildBreadcrumbJsonLd } from "@/lib/marketing/structured-data/breadcrumb";
import { buildWebsiteGraphNode } from "@/lib/marketing/structured-data/website";

function absoluteAssetUrl(origin: string, value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith("http") ? trimmed : `${origin}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

export function buildPortfolioJsonLdGraph(
  works: MarketingShowcaseWorkDto[],
  origin = VINCIS_SITE_ORIGIN
) {
  const graph: Record<string, unknown>[] = [
    buildOrganizationGraphNode(origin),
    buildWebsiteGraphNode(origin),
    buildBreadcrumbJsonLd(
      [
        { name: "Home", path: "/" },
        { name: "Cases", path: "/cases" }
      ],
      origin
    ),
    {
      "@type": "CollectionPage",
      "@id": `${origin}/cases#collection`,
      name: "VINCIS Portfolio",
      url: `${origin}/cases`
    }
  ];

  for (const work of works.slice(0, 24)) {
    const videoUrl = absoluteAssetUrl(origin, work.video_url);
    const thumbnailUrl = absoluteAssetUrl(origin, work.thumbnail_url);
    if (!videoUrl && !thumbnailUrl) continue;

    graph.push({
      "@type": "VideoObject",
      "@id": `${origin}/cases#video-${work.id}`,
      name: work.title,
      description: work.description,
      thumbnailUrl,
      contentUrl: videoUrl,
      uploadDate: work.created_at,
      publisher: { "@id": `${origin}/#organization` },
      genre: work.category
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}
