const ESCAPE_HTML: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ESCAPE_HTML[char] ?? char);
}

function isExternalUrl(href: string) {
  return /^https?:\/\//i.test(href);
}

function linkAttrs(href: string) {
  const safeHref = escapeHtml(href);
  if (isExternalUrl(href)) {
    return `href="${safeHref}" class="text-violet-700 underline" target="_blank" rel="noopener noreferrer"`;
  }
  return `href="${safeHref}" class="text-violet-700 underline"`;
}

function inlineMarkdown(text: string) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-zinc-100 px-1.5 py-0.5 text-[0.9em] text-zinc-800">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => `<a ${linkAttrs(String(href))}>${label}</a>`);
}

function isTableRow(line: string) {
  return line.includes("|") && line.trim().startsWith("|");
}

function isTableSeparator(line: string) {
  return /^\|?[\s:-]+\|[\s|:-]+\|?$/.test(line.trim());
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderTable(rows: string[][]) {
  if (!rows.length) return "";
  const [head, ...body] = rows;
  const headHtml = head.map((cell) => `<th class="border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-sm font-semibold text-zinc-900">${inlineMarkdown(cell)}</th>`).join("");
  const bodyHtml = body
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td class="border border-zinc-200 px-3 py-2 text-sm text-zinc-700">${inlineMarkdown(cell)}</td>`).join("")}</tr>`
    )
    .join("");
  return `<div class="my-6 overflow-x-auto"><table class="min-w-full border-collapse"><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
}

function renderImage(line: string) {
  const match = /^!\[([^\]]*)\]\(([^)]+)\)/.exec(line.trim());
  if (!match) return null;
  const alt = escapeHtml(match[1]);
  const src = escapeHtml(match[2]);
  return `<figure class="my-6 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50"><img src="${src}" alt="${alt}" class="w-full object-cover" loading="lazy" />${match[1] ? `<figcaption class="px-4 py-2 text-sm text-zinc-500">${alt}</figcaption>` : ""}</figure>`;
}

function renderHr() {
  return '<hr class="my-8 border-0 border-t border-zinc-200" />';
}

function renderCodeBlock(code: string, language?: string) {
  const lang = language ? ` data-language="${escapeHtml(language)}"` : "";
  return `<pre class="my-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-zinc-950 p-4 text-sm text-zinc-100"${lang}><code>${escapeHtml(code)}</code></pre>`;
}

function renderBlockquote(lines: string[]) {
  return `<blockquote class="my-6 border-l-4 border-violet-200 bg-violet-50/40 px-4 py-3 text-zinc-700">${lines.map((line) => `<p class="my-2">${inlineMarkdown(line)}</p>`).join("")}</blockquote>`;
}

type ListKind = "ul" | "ol" | "check";

function openList(kind: ListKind) {
  if (kind === "ol") return '<ol class="my-4 list-decimal space-y-2 pl-6 text-zinc-700">';
  if (kind === "check") return '<ul class="my-4 space-y-2 text-zinc-700">';
  return '<ul class="my-4 list-disc space-y-2 pl-6 text-zinc-700">';
}

function renderListItem(kind: ListKind, text: string, checked?: boolean) {
  if (kind === "check") {
    return `<li class="flex items-start gap-2"><span class="mt-1 text-sm">${checked ? "☑" : "☐"}</span><span>${inlineMarkdown(text)}</span></li>`;
  }
  return `<li>${inlineMarkdown(text)}</li>`;
}

export function renderKnowledgeMarkdown(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let listKind: ListKind | null = null;
  let codeLines: string[] = [];
  let codeLanguage = "";
  let inCode = false;
  let quoteLines: string[] = [];

  const closeList = () => {
    if (!listKind) return;
    html.push(listKind === "ol" ? "</ol>" : "</ul>");
    listKind = null;
  };

  const flushQuote = () => {
    if (!quoteLines.length) return;
    html.push(renderBlockquote(quoteLines));
    quoteLines = [];
  };

  const flushCode = () => {
    if (!inCode) return;
    html.push(renderCodeBlock(codeLines.join("\n"), codeLanguage));
    codeLines = [];
    codeLanguage = "";
    inCode = false;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (inCode) {
      if (trimmed.startsWith("```")) {
        flushCode();
      } else {
        codeLines.push(rawLine);
      }
      continue;
    }

    if (trimmed.startsWith("```")) {
      closeList();
      flushQuote();
      inCode = true;
      codeLanguage = trimmed.slice(3).trim();
      continue;
    }

    if (!trimmed) {
      closeList();
      flushQuote();
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeList();
      flushQuote();
      html.push(renderHr());
      continue;
    }

    const image = renderImage(trimmed);
    if (image && trimmed === rawLine.trim()) {
      closeList();
      flushQuote();
      html.push(image);
      continue;
    }

    if (trimmed.startsWith(">")) {
      closeList();
      quoteLines.push(trimmed.replace(/^>\s?/, ""));
      continue;
    }
    flushQuote();

    if (isTableRow(trimmed) && index + 1 < lines.length && isTableSeparator(lines[index + 1].trim())) {
      closeList();
      const tableRows = [parseTableRow(trimmed)];
      index += 2;
      while (index < lines.length && isTableRow(lines[index].trim())) {
        tableRows.push(parseTableRow(lines[index].trim()));
        index += 1;
      }
      index -= 1;
      html.push(renderTable(tableRows));
      continue;
    }

    const checklist = /^[-*]\s+\[( |x|X)\]\s+(.+)$/.exec(trimmed);
    if (checklist) {
      if (listKind !== "check") {
        closeList();
        html.push(openList("check"));
        listKind = "check";
      }
      html.push(renderListItem("check", checklist[2], checklist[1].toLowerCase() === "x"));
      continue;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (ordered) {
      if (listKind !== "ol") {
        closeList();
        html.push(openList("ol"));
        listKind = "ol";
      }
      html.push(renderListItem("ol", ordered[1]));
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (listKind !== "ul") {
        closeList();
        html.push(openList("ul"));
        listKind = "ul";
      }
      html.push(renderListItem("ul", trimmed.slice(2)));
      continue;
    }

    closeList();

    if (trimmed.startsWith("### ")) {
      html.push(`<h3 class="mt-8 text-xl font-semibold text-zinc-950">${inlineMarkdown(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      html.push(`<h2 class="mt-10 text-2xl font-semibold tracking-tight text-zinc-950">${inlineMarkdown(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      html.push(`<h1 class="mt-10 text-3xl font-semibold tracking-tight text-zinc-950">${inlineMarkdown(trimmed.slice(2))}</h1>`);
      continue;
    }

    html.push(`<p class="my-4 text-[17px] leading-8 text-zinc-700">${inlineMarkdown(trimmed)}</p>`);
  }

  flushCode();
  flushQuote();
  closeList();
  return html.join("");
}

export function extractKnowledgeToc(markdown: string) {
  const items: Array<{ id: string; label: string; level: number }> = [];
  for (const line of markdown.split("\n")) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const label = match[2].trim();
    const id = label
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, "")
      .replace(/\s+/g, "-");
    items.push({ id, label, level: match[1].length });
  }
  return items;
}
