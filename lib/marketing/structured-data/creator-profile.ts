import type { Creator, CreatorWork } from "@/lib/types";
import { VINCIS_SITE_ORIGIN, buildOrganizationGraphNode } from "@/lib/marketing/organization-schema";
import { buildWebsiteGraphNode } from "@/lib/marketing/structured-data/website";

function absoluteAssetUrl(origin: string, value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith("http") ? trimmed : `${origin}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

export function buildCreatorProfileJsonLdGraph(input: {
  creator: Creator;
  works: CreatorWork[];
  profileUrl: string;
  origin?: string;
}) {
  const origin = input.origin ?? VINCIS_SITE_ORIGIN;
  const personId = `${input.profileUrl}#person`;

  const graph: Record<string, unknown>[] = [
    buildOrganizationGraphNode(origin),
    buildWebsiteGraphNode(origin),
    {
      "@type": "Person",
      "@id": personId,
      name: input.creator.name,
      description: input.creator.bio || input.creator.headline,
      image: absoluteAssetUrl(origin, input.creator.avatar_url),
      url: input.profileUrl,
      jobTitle: input.creator.headline || undefined,
      homeLocation: input.creator.city
        ? {
            "@type": "Place",
            name: [input.creator.city, input.creator.country].filter(Boolean).join(", ")
          }
        : undefined,
      knowsAbout: input.creator.specialties?.length ? input.creator.specialties : undefined
    }
  ];

  for (const work of input.works.slice(0, 12)) {
    const videoUrl = absoluteAssetUrl(origin, work.video_url);
    const thumbnailUrl = absoluteAssetUrl(origin, work.thumbnail_url);
    if (!videoUrl && !thumbnailUrl) continue;

    graph.push({
      "@type": "VideoObject",
      "@id": `${input.profileUrl}#work-${work.id}`,
      name: work.title,
      description: work.description,
      thumbnailUrl,
      contentUrl: videoUrl,
      uploadDate: work.created_at,
      creator: { "@id": personId },
      publisher: { "@id": `${origin}/#organization` },
      genre: work.category,
      keywords: work.tags.join(", ")
    });

    graph.push({
      "@type": "CreativeWork",
      "@id": `${input.profileUrl}#creative-work-${work.id}`,
      name: work.title,
      description: work.description,
      creator: { "@id": personId },
      image: thumbnailUrl,
      url: videoUrl,
      genre: work.category
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}
