import type { Editor } from "@tiptap/core";

export type KnowledgeBlockStyle = "body" | "h1" | "h2" | "h3";

export function knowledgeBlockStyleValue(editor: Editor): KnowledgeBlockStyle {
  if (editor.isActive("heading", { level: 1 })) return "h1";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  return "body";
}

export function knowledgeSetBlockStyle(editor: Editor, style: KnowledgeBlockStyle) {
  const chain = editor.chain().focus();
  if (style === "h1") chain.setHeading({ level: 1 }).run();
  else if (style === "h2") chain.setHeading({ level: 2 }).run();
  else if (style === "h3") chain.setHeading({ level: 3 }).run();
  else chain.setParagraph().run();
}

export function knowledgeToggleCode(editor: Editor) {
  if (editor.isActive("codeBlock")) {
    editor.chain().focus().toggleCodeBlock().run();
    return;
  }
  if (editor.state.selection.empty) {
    editor.chain().focus().toggleCodeBlock().run();
    return;
  }
  editor.chain().focus().toggleCode().run();
}

export function knowledgeSetLink(editor: Editor, zh: boolean) {
  const previous = editor.getAttributes("link").href as string | undefined;
  const href = window.prompt(zh ? "输入链接 URL" : "Enter link URL", previous ?? "https://");
  if (href === null) return;
  const trimmed = href.trim();
  if (!trimmed) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  if (editor.state.selection.empty) {
    editor.chain().focus().insertContent(`<a href="${trimmed}">${trimmed}</a>`).run();
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
}

export function knowledgeInsertYoutube(editor: Editor, zh: boolean) {
  const url = window.prompt(zh ? "输入 YouTube 链接" : "Enter YouTube URL");
  if (!url?.trim()) return;
  editor.commands.setYoutubeVideo({ src: url.trim() });
}

export function knowledgeInsertVideo(editor: Editor, zh: boolean) {
  const src = window.prompt(zh ? "输入视频 URL（MP4 / WebM）" : "Enter video URL (MP4 / WebM)");
  if (!src?.trim()) return;
  editor.chain().focus().setKnowledgeVideo(src.trim()).run();
}

export function knowledgeInsertTable(editor: Editor) {
  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
}

export function knowledgeInsertEmoji(editor: Editor, emoji: string) {
  editor.chain().focus().insertContent(emoji).run();
}

export function knowledgeSetTextColor(editor: Editor, color: string | null) {
  if (!color) {
    editor.chain().focus().unsetColor().run();
    return;
  }
  editor.chain().focus().setColor(color).run();
}

export function knowledgeSetImageAlign(editor: Editor, align: "left" | "center" | "right") {
  editor.chain().focus().updateAttributes("image", { align }).run();
}

export function knowledgeSetImageWidth(editor: Editor, width: string) {
  editor.chain().focus().updateAttributes("image", { width }).run();
}
