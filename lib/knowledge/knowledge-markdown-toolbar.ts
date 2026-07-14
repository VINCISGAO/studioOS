export type MarkdownSelection = {
  start: number;
  end: number;
};

export type MarkdownEditResult = {
  next: string;
  selectionStart: number;
  selectionEnd: number;
};

export function wrapAt(
  value: string,
  selection: MarkdownSelection,
  before: string,
  after: string,
  placeholder: string
): MarkdownEditResult {
  const selected = value.slice(selection.start, selection.end) || placeholder;
  const next = value.slice(0, selection.start) + before + selected + after + value.slice(selection.end);
  const cursorStart = selection.start + before.length;
  const cursorEnd = cursorStart + selected.length;
  return { next, selectionStart: cursorStart, selectionEnd: cursorEnd };
}

export function prefixLinesAt(value: string, selection: MarkdownSelection, prefix: string): MarkdownEditResult {
  const lineStart = value.lastIndexOf("\n", selection.start - 1) + 1;
  const lineEnd = value.indexOf("\n", selection.end);
  const blockEnd = lineEnd === -1 ? value.length : lineEnd;
  const block = value.slice(lineStart, blockEnd);
  const prefixed = block
    .split("\n")
    .map((line) => {
      const stripped = line.replace(/^#{1,6}\s+/, "");
      return line.startsWith(prefix) ? line : `${prefix}${stripped}`;
    })
    .join("\n");
  const next = value.slice(0, lineStart) + prefixed + value.slice(blockEnd);
  return { next, selectionStart: lineStart, selectionEnd: lineStart + prefixed.length };
}

export function clearHeadingAt(value: string, selection: MarkdownSelection): MarkdownEditResult {
  const lineStart = value.lastIndexOf("\n", selection.start - 1) + 1;
  const lineEnd = value.indexOf("\n", selection.end);
  const blockEnd = lineEnd === -1 ? value.length : lineEnd;
  const line = value.slice(lineStart, blockEnd).replace(/^#{1,6}\s+/, "");
  const next = value.slice(0, lineStart) + line + value.slice(blockEnd);
  return { next, selectionStart: lineStart, selectionEnd: lineStart + line.length };
}

export function insertAt(value: string, selection: MarkdownSelection, snippet: string): MarkdownEditResult {
  const next = value.slice(0, selection.start) + snippet + value.slice(selection.end);
  const cursor = selection.start + snippet.length;
  return { next, selectionStart: cursor, selectionEnd: cursor };
}

export function codeBlockAt(value: string, selection: MarkdownSelection, placeholder: string): MarkdownEditResult {
  const selected = value.slice(selection.start, selection.end) || placeholder;
  const snippet = `\n\`\`\`\n${selected}\n\`\`\`\n`;
  return insertAt(value, selection, snippet);
}

export function linkAt(value: string, selection: MarkdownSelection, href: string, label: string): MarkdownEditResult {
  const text = value.slice(selection.start, selection.end) || label;
  const snippet = `[${text}](${href})`;
  return insertAt(value, selection, snippet);
}

export function imageAt(value: string, selection: MarkdownSelection, src: string, alt: string): MarkdownEditResult {
  const snippet = `![${alt}](${src})`;
  return insertAt(value, selection, snippet);
}

export function videoAt(value: string, selection: MarkdownSelection, src: string): MarkdownEditResult {
  const snippet = `\n\n<video src="${src}" controls></video>\n\n`;
  return insertAt(value, selection, snippet);
}

export function tableAt(value: string, selection: MarkdownSelection, zh: boolean): MarkdownEditResult {
  const snippet = zh
    ? "\n| 列 1 | 列 2 |\n| --- | --- |\n|  |  |\n"
    : "\n| Col 1 | Col 2 |\n| --- | --- |\n|  |  |\n";
  return insertAt(value, selection, snippet);
}

export function horizontalRuleAt(value: string, selection: MarkdownSelection): MarkdownEditResult {
  return insertAt(value, selection, "\n\n---\n\n");
}

export type BlockStyle = "body" | "h2" | "h3";

export function applyBlockStyle(value: string, selection: MarkdownSelection, style: BlockStyle): MarkdownEditResult {
  if (style === "body") return clearHeadingAt(value, selection);
  if (style === "h2") return prefixLinesAt(value, selection, "## ");
  return prefixLinesAt(value, selection, "### ");
}
