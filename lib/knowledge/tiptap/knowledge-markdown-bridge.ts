import type { Editor } from "@tiptap/core";
import { createKnowledgeEditorExtensions } from "@/lib/knowledge/tiptap/knowledge-editor-extensions";

export function knowledgeEditorExtensionsForLocale(languageCode: string) {
  const locale = languageCode.startsWith("zh") ? "zh" : "en";
  return createKnowledgeEditorExtensions(locale);
}

export function knowledgeHtmlFromEditor(editor: Editor) {
  return editor.getHTML();
}

export function knowledgeHtmlRoundtripSamples() {
  return [
    "<h2>Section title</h2><p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>",
    "<h3>Subsection</h3><ul><li><p>Bullet one</p></li><li><p>Bullet two</p></li></ul>",
    "<blockquote><p>Quote</p></blockquote><hr><p><code>inline</code></p>",
    '<p><a href="https://vincis.app">VINCIS</a></p>'
  ];
}

export function assertKnowledgeHtmlRoundtrip(editor: Editor, html: string) {
  editor.commands.setContent(html, false);
  const next = editor.getHTML();
  return next.includes("<") && next.length > 0;
}
