"use client";

/**
 * Editor host — direct client import only.
 * next/dynamic never resolved this chunk (even empty stub); direct import works.
 */
import { KnowledgeTiptapEditorInner } from "@/components/studioos/knowledge-editor/tiptap/knowledge-tiptap-editor";

type EditorProps = {
  locale: "zh" | "en";
  value: string;
  onChange: (html: string) => void;
  onNotify: (message: string, variant: "success" | "error" | "info") => void;
  stickyToolbarTop?: number;
};

export function KnowledgeTiptapEditor(props: EditorProps) {
  return <KnowledgeTiptapEditorInner {...props} />;
}
