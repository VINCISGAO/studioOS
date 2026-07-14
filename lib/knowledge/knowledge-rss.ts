import type { KnowledgeArticleListItemDto } from "@/features/knowledge-center/knowledge-center.types";

export type KnowledgeRssItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
};

export function buildKnowledgeRssXml(channel: {
  title: string;
  link: string;
  description: string;
  language: string;
  items: KnowledgeRssItem[];
}) {
  const items = channel.items
    .map(
      (item) => `
  <item>
    <title>${escapeXml(item.title)}</title>
    <link>${escapeXml(item.link)}</link>
    <description>${escapeXml(item.description)}</description>
    <pubDate>${item.pubDate}</pubDate>
    <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
  </item>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(channel.title)}</title>
  <link>${escapeXml(channel.link)}</link>
  <description>${escapeXml(channel.description)}</description>
  <language>${escapeXml(channel.language)}</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
</channel>
</rss>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function articleToRssItem(
  article: KnowledgeArticleListItemDto,
  origin: string,
  path: string,
  description: string
): KnowledgeRssItem {
  return {
    title: article.title,
    link: `${origin}${path}`,
    description,
    pubDate: new Date(article.updated_at).toUTCString(),
    guid: `${origin}${path}`
  };
}
