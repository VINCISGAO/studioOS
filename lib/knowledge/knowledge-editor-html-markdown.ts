import MarkdownIt from "markdown-it";

const markdownIt = new MarkdownIt({ html: false, breaks: true, linkify: false });

export function knowledgeEditorMarkdownToHtml(markdown: string) {
  const trimmed = markdown.trim();
  if (!trimmed) return "";
  return markdownIt.render(trimmed);
}

function serializeNode(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replace(/\s+/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const inner = Array.from(el.childNodes).map(serializeNode).join("");

  switch (tag) {
    case "strong":
    case "b":
      return inner ? `**${inner.trim()}**` : "";
    case "em":
    case "i":
      return inner ? `*${inner.trim()}*` : "";
    case "h1":
      return `# ${inner.trim()}\n\n`;
    case "h2":
      return `## ${inner.trim()}\n\n`;
    case "h3":
      return `### ${inner.trim()}\n\n`;
    case "p":
      return inner.trim() ? `${inner.trim()}\n\n` : "";
    case "br":
      return "\n";
    case "ul":
      return (
        Array.from(el.children)
          .filter((child) => child.tagName === "LI")
          .map((child) => `- ${serializeNode(child).trim()}`)
          .join("\n") + "\n\n"
      );
    case "ol":
      return (
        Array.from(el.children)
          .filter((child) => child.tagName === "LI")
          .map((child, index) => `${index + 1}. ${serializeNode(child).trim()}`)
          .join("\n") + "\n\n"
      );
    case "li":
      return Array.from(el.childNodes).map(serializeNode).join("");
    case "blockquote":
      return (
        inner
          .trim()
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n") + "\n\n"
      );
    case "a": {
      const href = el.getAttribute("href") ?? "";
      return `[${inner.trim()}](${href})`;
    }
    case "img": {
      const src = el.getAttribute("src") ?? "";
      const alt = el.getAttribute("alt") ?? "";
      return `![${alt}](${src})\n\n`;
    }
    case "div":
      return inner.trim() ? `${inner.trim()}\n\n` : "";
    default:
      return inner;
  }
}

export function knowledgeEditorHtmlToMarkdown(html: string) {
  if (typeof document === "undefined") return "";
  const container = document.createElement("div");
  container.innerHTML = html;
  const markdown = Array.from(container.childNodes)
    .map(serializeNode)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
  if (markdown) return markdown;
  const plain = container.textContent?.replace(/\u00a0/g, " ").trim();
  return plain ?? "";
}
