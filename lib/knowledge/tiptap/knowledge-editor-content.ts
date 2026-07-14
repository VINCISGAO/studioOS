import type { Content } from "@tiptap/core";

/** Client-safe: normalize stored body into TipTap `content` (HTML or JSON doc). */
export function normalizeKnowledgeEditorContent(raw: string): Content {
  const trimmed = raw.trim();
  if (!trimmed) return "<p></p>";

  if (trimmed.startsWith("{")) {
    try {
      const json = JSON.parse(trimmed) as { type?: string };
      if (json.type === "doc") return json;
    } catch {
      // fall through to HTML / plain text handling
    }
  }

  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    const escaped = trimmed
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<p>${escaped.replace(/\n\n+/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
  }

  return trimmed;
}

export function knowledgeEditorPlainTextLength(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}
