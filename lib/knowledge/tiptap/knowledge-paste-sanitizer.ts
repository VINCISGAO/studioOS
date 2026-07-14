export function sanitizeKnowledgePastedHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\s(on\w+|style)=(".*?"|'.*?')/gi, "")
    .replace(/<h1\b[^>]*>/gi, "<h2>")
    .replace(/<\/h1>/gi, "</h2>");
}

export function normalizeKnowledgePastedText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
}
