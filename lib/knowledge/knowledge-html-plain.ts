import { renderKnowledgeMarkdown } from "@/lib/knowledge/knowledge-markdown";

export function knowledgeHtmlToPlainText(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function knowledgeHtmlIsEmpty(html: string) {
  return !knowledgeHtmlToPlainText(html);
}

export function resolveKnowledgeBodyHtml(input: { body_html?: string | null; body_markdown?: string | null }) {
  const html = (input.body_html ?? "").trim();
  if (html) return html;
  const markdown = (input.body_markdown ?? "").trim();
  if (!markdown) return "";
  return renderKnowledgeMarkdown(markdown);
}

export type KnowledgeHtmlTocItem = { id: string; label: string; level: 2 | 3 };

export function withKnowledgeHeadingIds(html: string): { html: string; toc: KnowledgeHtmlTocItem[] } {
  const toc: KnowledgeHtmlTocItem[] = [];
  let index = 0;
  const nextHtml = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, levelRaw, attrs, inner) => {
    const level = Number(levelRaw) as 2 | 3;
    const label = knowledgeHtmlToPlainText(inner);
    if (!label) return full;
    const existing = (attrs as string).match(/\bid=["']([^"']+)["']/i);
    const id = existing?.[1] ?? `section-${index + 1}`;
    toc.push({ id, label, level });
    index += 1;
    if (existing) return full;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
  return { html: nextHtml, toc };
}

export function extractKnowledgeHtmlToc(html: string): KnowledgeHtmlTocItem[] {
  return withKnowledgeHeadingIds(html).toc;
}
