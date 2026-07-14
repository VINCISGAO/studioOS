const CJK_CHAR_PATTERN = /[\u4e00-\u9fff\u3400-\u4dbf]/g;

function stripMarkdownNoise(markdown: string) {
  return markdown.replace(/[#>*_`[\]()!-]/g, " ");
}

function countCjkChars(text: string) {
  return (text.match(CJK_CHAR_PATTERN) ?? []).length;
}

function countLatinWords(text: string) {
  return text
    .replace(CJK_CHAR_PATTERN, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function knowledgeEditorWordCount(markdown: string) {
  const cleaned = stripMarkdownNoise(markdown);
  return countCjkChars(cleaned) + countLatinWords(cleaned);
}

export function knowledgeEditorCharCount(markdown: string) {
  return markdown.length;
}

export function knowledgeEditorReadingTimeLabel(markdown: string, zh = false) {
  const cleaned = stripMarkdownNoise(markdown);
  const cjkChars = countCjkChars(cleaned);
  const latinWords = countLatinWords(cleaned);
  const minutes = Math.max(1, Math.round(cjkChars / 300 + latinWords / 220));
  if (minutes <= 1) return zh ? "约 1 分钟" : "~1 min";
  return zh ? `约 ${minutes} 分钟` : `~${minutes} min`;
}
