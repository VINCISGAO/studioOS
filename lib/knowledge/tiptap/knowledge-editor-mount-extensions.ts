import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

/**
 * Minimal TipTap stack for browser mount verification.
 * Restore full set from knowledge-editor-extensions.ts after mount is stable.
 */
export function createKnowledgeEditorMountExtensions(locale: "zh" | "en") {
  const zh = locale === "zh";
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] }
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        class: "text-violet-700 underline",
        rel: "noopener noreferrer"
      }
    }),
    Placeholder.configure({
      placeholder: zh ? "开始撰写正文…" : "Start writing…"
    })
  ];
}
