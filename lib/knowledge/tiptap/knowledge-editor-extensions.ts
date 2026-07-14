import type { CharacterCountStorage } from "@tiptap/extension-character-count";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Youtube from "@tiptap/extension-youtube";
import { KnowledgeCalloutExtension } from "@/lib/knowledge/tiptap/knowledge-callout-extension";
import { KnowledgeEnhancedImage } from "@/lib/knowledge/tiptap/knowledge-enhanced-image";
import { KnowledgeVideoExtension } from "@/lib/knowledge/tiptap/knowledge-video-extension";

declare module "@tiptap/core" {
  interface Storage {
    characterCount: CharacterCountStorage;
  }
}

export function createKnowledgeEditorExtensions(locale: "zh" | "en") {
  const zh = locale === "zh";
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      horizontalRule: false,
      dropcursor: false,
      gapcursor: false
    }),
    TextStyle,
    Color,
    Underline,
    Highlight.configure({ multicolor: false }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        class: "text-violet-700 underline",
        rel: "noopener noreferrer"
      }
    }),
    KnowledgeEnhancedImage.configure({
      allowBase64: false,
      inline: false,
      HTMLAttributes: {
        class: "knowledge-inline-image"
      }
    }),
    Youtube.configure({
      controls: true,
      nocookie: true,
      HTMLAttributes: {
        class: "knowledge-youtube mx-auto my-6 aspect-video w-full max-w-3xl rounded-2xl"
      }
    }),
    Placeholder.configure({
      placeholder: zh ? "开始撰写正文…" : "Start writing…"
    }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList.configure({
      HTMLAttributes: {
        class: "knowledge-task-list"
      }
    }),
    TaskItem.configure({
      nested: true,
      HTMLAttributes: {
        class: "knowledge-task-item"
      }
    }),
    HorizontalRule,
    Dropcursor,
    Gapcursor,
    KnowledgeCalloutExtension,
    KnowledgeVideoExtension,
    CharacterCount
  ];
}
