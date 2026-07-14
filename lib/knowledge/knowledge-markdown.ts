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

function inlineMarkdown(text: string) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-violet-700 underline">$1</a>');
}

export function renderKnowledgeMarkdown(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3 class="mt-8 text-xl font-semibold text-zinc-950">${inlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2 class="mt-10 text-2xl font-semibold tracking-tight text-zinc-950">${inlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1 class="mt-10 text-3xl font-semibold tracking-tight text-zinc-950">${inlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith("> ")) {
      closeList();
      html.push(`<blockquote class="my-4 border-l-4 border-violet-200 pl-4 text-zinc-600">${inlineMarkdown(line.slice(2))}</blockquote>`);
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) {
        html.push('<ul class="my-4 list-disc space-y-2 pl-6 text-zinc-700">');
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p class="my-4 text-[17px] leading-8 text-zinc-700">${inlineMarkdown(line)}</p>`);
  }

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
