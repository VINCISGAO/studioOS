"use client";

import { BubbleMenu, type Editor } from "@tiptap/react";
import { knowledgeSetLink } from "@/lib/knowledge/tiptap/knowledge-wysiwyg-commands";
import { cn } from "@/lib/utils";
import { Bold, Highlighter, Italic, Link2, Underline } from "lucide-react";

type Props = {
  editor: Editor;
  zh: boolean;
};

function BubbleButton({
  active,
  onClick,
  label,
  children
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100",
        active && "bg-violet-50 text-violet-700"
      )}
    >
      {children}
    </button>
  );
}

export function KnowledgeTiptapBubble({ editor, zh }: Props) {
  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-0.5 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg"
    >
      <BubbleButton label={zh ? "粗体" : "Bold"} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </BubbleButton>
      <BubbleButton label={zh ? "斜体" : "Italic"} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </BubbleButton>
      <BubbleButton
        label={zh ? "下划线" : "Underline"}
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="h-4 w-4" />
      </BubbleButton>
      <BubbleButton
        label={zh ? "高亮" : "Highlight"}
        active={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter className="h-4 w-4" />
      </BubbleButton>
      <BubbleButton label={zh ? "链接" : "Link"} active={editor.isActive("link")} onClick={() => knowledgeSetLink(editor, zh)}>
        <Link2 className="h-4 w-4" />
      </BubbleButton>
    </BubbleMenu>
  );
}
