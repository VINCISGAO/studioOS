import { parseDocument } from "htmlparser2";
import type { ChildNode, Element, Text } from "domhandler";
import { isTag, isText } from "domhandler";
import MarkdownIt from "markdown-it";
import taskLists from "markdown-it-task-lists";
import { sanitizeKnowledgeHtml } from "@/lib/knowledge/sanitize-knowledge-html";

const markdownIt = new MarkdownIt({ html: true, breaks: false, linkify: false }).use(taskLists, {
  enabled: false,
  label: true,
  labelAfter: true
});

function elementAttrs(node: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const [key, value] of Object.entries(node.attribs)) {
    if (typeof value === "string") attrs[key] = value;
  }
  return attrs;
}

function attrsToString(attrs: Record<string, string>, allow: string[]) {
  return allow
    .filter((key) => attrs[key])
    .map((key) => `${key}="${attrs[key]}"`)
    .join(" ");
}

function serializeInline(nodes: ChildNode[]): string {
  return nodes.map(serializeNode).join("");
}

function serializeNode(node: ChildNode): string {
  if (isText(node)) {
    return (node as Text).data.replace(/\s+/g, (match) => (match.includes("\n") ? " " : match));
  }
  if (!isTag(node)) return "";

  const el = node as Element;
  const tag = el.name.toLowerCase();
  const attrs = elementAttrs(el);
  const inner = serializeInline(el.children);

  switch (tag) {
    case "strong":
    case "b":
      return inner ? `**${inner.trim()}**` : "";
    case "em":
    case "i":
      return inner ? `*${inner.trim()}*` : "";
    case "u":
      return inner ? `<u>${inner}</u>` : "";
    case "s":
    case "strike":
      return inner ? `~~${inner.trim()}~~` : "";
    case "mark":
      return inner ? `<mark>${inner}</mark>` : "";
    case "code":
      return inner ? `\`${inner}\`` : "";
    case "br":
      return "\n";
    case "a": {
      const href = attrs.href ?? "";
      return `[${inner.trim()}](${href})`;
    }
    case "img": {
      const src = attrs.src ?? "";
      const alt = attrs.alt ?? "";
      return `![${alt}](${src})`;
    }
    case "span":
    case "label":
      return inner;
    case "input":
      return "";
    default:
      return inner;
  }
}

function blockFromChildren(nodes: ChildNode[]): string {
  return nodes.map(blockFromNode).filter(Boolean).join("\n\n");
}

function isTaskListItem(li: Element) {
  const checkbox = li.children.find(
    (child) => isTag(child) && child.name.toLowerCase() === "input" && child.attribs.type === "checkbox"
  );
  return Boolean(checkbox);
}

function taskListItemMarkdown(li: Element) {
  const checkbox = li.children.find(
    (child) => isTag(child) && child.name.toLowerCase() === "input" && child.attribs.type === "checkbox"
  ) as Element | undefined;
  const checked = checkbox?.attribs.checked !== undefined;
  const content = li.children
    .filter((child) => !(isTag(child) && child.name.toLowerCase() === "input"))
    .map(blockFromNode)
    .join("\n")
    .trim();
  return `- [${checked ? "x" : " "}] ${content}`;
}

function listMarkdown(list: Element, ordered: boolean) {
  const items = list.children.filter((child) => isTag(child) && child.name.toLowerCase() === "li") as Element[];
  if (items.length === 0) return "";

  if (items.every(isTaskListItem)) {
    return items.map(taskListItemMarkdown).join("\n");
  }

  return items
    .map((item, index) => {
      const prefix = ordered ? `${index + 1}. ` : "- ";
      const content = item.children.map(blockFromNode).join("\n").trim();
      return `${prefix}${content}`;
    })
    .join("\n");
}

function tableMarkdown(table: Element) {
  const sections = table.children.filter(
    (child): child is Element =>
      isTag(child) && ["thead", "tbody", "tr"].includes(child.name.toLowerCase())
  );

  const rows = sections.flatMap((section) => {
    if (section.name.toLowerCase() === "tr") return [section];
    return section.children.filter(
      (child): child is Element => isTag(child) && child.name.toLowerCase() === "tr"
    );
  });

  const matrix = rows.map((row) =>
    row.children
      .filter((child) => isTag(child) && ["th", "td"].includes(child.name.toLowerCase()))
      .map((cell) => serializeInline((cell as Element).children).replace(/\|/g, "\\|").trim())
  );

  if (matrix.length === 0) return "";

  const width = Math.max(...matrix.map((row) => row.length));
  const normalized = matrix.map((row) => {
    while (row.length < width) row.push("");
    return row;
  });

  const header = normalized[0];
  const divider = header.map(() => "---");
  const body = normalized.slice(1);

  return [
    `| ${header.join(" | ")} |`,
    `| ${divider.join(" | ")} |`,
    ...body.map((row) => `| ${row.join(" | ")} |`)
  ].join("\n");
}

function preserveHtmlBlock(el: Element): string {
  const attrs = elementAttrs(el);
  const attrString = Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");
  const open = attrString ? `<${el.name} ${attrString}>` : `<${el.name}>`;
  const inner = el.children
    .map((child) => {
      if (isText(child)) return (child as Text).data;
      if (!isTag(child)) return "";
      const nested = child as Element;
      if (["iframe", "video", "source", "img"].includes(nested.name.toLowerCase())) {
        const nestedAttrs = Object.entries(elementAttrs(nested))
          .map(([key, value]) => `${key}="${value}"`)
          .join(" ");
        return nestedAttrs ? `<${nested.name} ${nestedAttrs}>` : `<${nested.name}>`;
      }
      return preserveHtmlBlock(nested);
    })
    .join("");
  return `${open}${inner}</${el.name}>`;
}

function blockFromNode(node: ChildNode): string {
  if (isText(node)) {
    const text = (node as Text).data.replace(/\s+/g, " ").trim();
    return text;
  }
  if (!isTag(node)) return "";

  const el = node as Element;
  const tag = el.name.toLowerCase();
  const attrs = elementAttrs(el);

  if (attrs["data-type"] === "knowledge-callout" || attrs["data-type"] === "knowledge-video") {
    return preserveHtmlBlock(el);
  }

  switch (tag) {
    case "h1":
      return `# ${serializeInline(el.children).trim()}`;
    case "h2":
      return `## ${serializeInline(el.children).trim()}`;
    case "h3":
      return `### ${serializeInline(el.children).trim()}`;
    case "h4":
      return `#### ${serializeInline(el.children).trim()}`;
    case "p":
      return serializeInline(el.children).trim();
    case "blockquote": {
      const inner = blockFromChildren(el.children)
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
      return inner;
    }
    case "ul":
      return listMarkdown(el, false);
    case "ol":
      return listMarkdown(el, true);
    case "li":
      return serializeInline(el.children).trim();
    case "pre": {
      const codeChild = el.children.find((child) => isTag(child) && child.name.toLowerCase() === "code") as
        | Element
        | undefined;
      const code = codeChild ? serializeInline(codeChild.children) : serializeInline(el.children);
      return `\`\`\`\n${code.trim()}\n\`\`\``;
    }
    case "code":
      return `\`${serializeInline(el.children).trim()}\``;
    case "hr":
      return "---";
    case "table":
      return tableMarkdown(el);
    case "figure": {
      const img = el.children.find((child) => isTag(child) && child.name.toLowerCase() === "img") as Element | undefined;
      if (!img) return blockFromChildren(el.children);
      const imgAttrs = elementAttrs(img);
      const figAttrs = attrsToString(attrs, ["data-type", "data-align", "data-width", "class"]);
      const imageAttrs = attrsToString(imgAttrs, ["src", "alt", "title", "data-align", "data-width"]);
      return `<figure ${figAttrs}><img ${imageAttrs} /></figure>`;
    }
    case "img": {
      const imageAttrs = attrsToString(attrs, ["src", "alt", "title", "class", "data-align", "data-width"]);
      return `<img ${imageAttrs} />`;
    }
    case "iframe": {
      const iframeAttrs = attrsToString(attrs, [
        "src",
        "allow",
        "allowfullscreen",
        "frameborder",
        "width",
        "height",
        "class",
        "data-youtube-video"
      ]);
      return `<iframe ${iframeAttrs}></iframe>`;
    }
    case "div":
    case "section":
      return blockFromChildren(el.children);
    default:
      return blockFromChildren(el.children);
  }
}

/** Server-side TipTap HTML → structured Markdown for GPT translation. */
export function knowledgeHtmlToMarkdownServer(html: string) {
  const trimmed = html.trim();
  if (!trimmed) return "";

  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  const doc = parseDocument(trimmed);
  const markdown = blockFromChildren(doc.children)
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return markdown || trimmed.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Server-side Markdown → TipTap-compatible HTML for translated locales. */
export function knowledgeMarkdownToHtmlServer(markdown: string) {
  const trimmed = markdown.trim();
  if (!trimmed) return "";
  const rendered = markdownIt.render(trimmed);
  return sanitizeKnowledgeHtml(rendered);
}
