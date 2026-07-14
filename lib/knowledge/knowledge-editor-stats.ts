export function knowledgeEditorWordCount(markdown: string) {
  return markdown
    .replace(/[#>*_`[\]()!-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function knowledgeEditorCharCount(markdown: string) {
  return markdown.length;
}

export function knowledgeEditorReadingTimeLabel(markdown: string, zh = false) {
  const words = knowledgeEditorWordCount(markdown);
  const minutes = Math.max(1, Math.round(words / 220));
  if (minutes <= 1) return zh ? "约 1 分钟" : "~1 min";
  return zh ? `约 ${minutes} 分钟` : `~${minutes} min`;
}
