"use client";

import type { ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import {
  knowledgeBlockStyleValue,
  knowledgeInsertEmoji,
  knowledgeInsertTable,
  knowledgeInsertVideo,
  knowledgeInsertYoutube,
  knowledgeSetBlockStyle,
  knowledgeSetLink,
  knowledgeSetTextColor,
  knowledgeToggleCode,
  type KnowledgeBlockStyle
} from "@/lib/knowledge/tiptap/knowledge-wysiwyg-commands";
import {
  Bold,
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Underline,
  Undo2,
  Video,
  Youtube
} from "lucide-react";
import { KnowledgeTiptapImageActions } from "@/components/studioos/knowledge-editor/tiptap/knowledge-tiptap-image-actions";

const EMOJIS = ["😀", "🔥", "✅", "💡", "📌", "🎯", "🚀", "⭐"];

const COLORS = [
  { label: "Default", value: null },
  { label: "Violet", value: "#7c3aed" },
  { label: "Rose", value: "#e11d48" },
  { label: "Amber", value: "#d97706" },
  { label: "Emerald", value: "#059669" },
  { label: "Zinc", value: "#3f3f46" }
] as const;

type Props = {
  editor: Editor;
  zh: boolean;
  onNotify: (message: string, variant: "success" | "error" | "info") => void;
};

function ToolButton({
  active,
  disabled,
  onClick,
  label,
  children
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40",
        active && "bg-violet-50 text-violet-700"
      )}
    >
      {children}
    </button>
  );
}

export function KnowledgeTiptapToolbar({ editor, zh, onNotify }: Props) {
  const block = knowledgeBlockStyleValue(editor);

  function setBlock(style: KnowledgeBlockStyle) {
    knowledgeSetBlockStyle(editor, style);
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-100 px-2 py-2">
      <ToolButton label={zh ? "撤销" : "Undo"} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={zh ? "重做" : "Redo"} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-zinc-200" />
      <ToolButton label="H1" active={block === "h1"} onClick={() => setBlock("h1")}>
        <Heading1 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="H2" active={block === "h2"} onClick={() => setBlock("h2")}>
        <Heading2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="H3" active={block === "h3"} onClick={() => setBlock("h3")}>
        <Heading3 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={zh ? "正文" : "Body"} active={block === "body"} onClick={() => setBlock("body")}>
        <Pilcrow className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-zinc-200" />
      <ToolButton label={zh ? "粗体" : "Bold"} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={zh ? "斜体" : "Italic"} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={zh ? "下划线" : "Underline"} active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={zh ? "删除线" : "Strike"} active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={zh ? "高亮" : "Highlight"} active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
        <Highlighter className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={zh ? "链接" : "Link"} active={editor.isActive("link")} onClick={() => knowledgeSetLink(editor, zh)}>
        <Link2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={zh ? "代码" : "Code"} active={editor.isActive("code") || editor.isActive("codeBlock")} onClick={() => knowledgeToggleCode(editor)}>
        <Code className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-zinc-200" />
      <ToolButton label={zh ? "无序列表" : "Bullet list"} active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={zh ? "有序列表" : "Ordered list"} active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </ToolButton>
      <ToolButton label="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <CheckSquare className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={zh ? "引用" : "Quote"} active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={zh ? "分隔线" : "Divider"} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={zh ? "表格" : "Table"} onClick={() => knowledgeInsertTable(editor)}>
        <Table className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-zinc-200" />
      <KnowledgeTiptapImageActions editor={editor} zh={zh} onNotify={onNotify} />
      <ToolButton label="YouTube" onClick={() => knowledgeInsertYoutube(editor, zh)}>
        <Youtube className="h-4 w-4" />
      </ToolButton>
      <ToolButton label={zh ? "视频" : "Video"} onClick={() => knowledgeInsertVideo(editor, zh)}>
        <Video className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-zinc-200" />
      <select
        className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700"
        value={(editor.getAttributes("textStyle").color as string | undefined) ?? ""}
        onChange={(event) => knowledgeSetTextColor(editor, event.target.value || null)}
        aria-label={zh ? "文字颜色" : "Text color"}
      >
        {COLORS.map((item) => (
          <option key={item.label} value={item.value ?? ""}>
            {item.label}
          </option>
        ))}
      </select>
      <div className="ml-1 flex items-center gap-0.5">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm hover:bg-zinc-100"
            onClick={() => knowledgeInsertEmoji(editor, emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
