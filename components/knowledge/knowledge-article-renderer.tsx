import {
  resolveKnowledgeBodyHtml,
  sanitizeKnowledgeHtml,
  withKnowledgeHeadingIds
} from "@/lib/knowledge/knowledge-html";

type KnowledgeArticleRendererProps = {
  html?: string;
  markdown?: string;
  className?: string;
  emptyLabel?: string;
};

export function KnowledgeArticleRenderer({
  html,
  markdown,
  className = "prose-vincis",
  emptyLabel = "No content yet."
}: KnowledgeArticleRendererProps) {
  const resolved = resolveKnowledgeBodyHtml({ body_html: html, body_markdown: markdown });
  const prepared = resolved.trim()
    ? withKnowledgeHeadingIds(resolved).html
    : `<p><em>${emptyLabel}</em></p>`;
  const content = sanitizeKnowledgeHtml(prepared);
  return <div className={className} dangerouslySetInnerHTML={{ __html: content }} />;
}
