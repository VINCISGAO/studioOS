"use client";

import { Editor } from "@tiptap/core";
import { createKnowledgeEditorExtensions } from "@/lib/knowledge/tiptap/knowledge-editor-extensions";
import {
  knowledgeEditorPlainTextLength,
  normalizeKnowledgeEditorContent
} from "@/lib/knowledge/tiptap/knowledge-editor-content";
import {
  normalizeKnowledgePastedText,
  sanitizeKnowledgePastedHtml
} from "@/lib/knowledge/tiptap/knowledge-paste-sanitizer";
import { KnowledgeTiptapEditorError } from "@/components/studioos/knowledge-editor/tiptap/knowledge-tiptap-editor-error";
import { KnowledgeTiptapToolbar } from "@/components/studioos/knowledge-editor/tiptap/knowledge-tiptap-toolbar";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  locale: "zh" | "en";
  value: string;
  onChange: (html: string) => void;
  onNotify: (message: string, variant: "success" | "error" | "info") => void;
};

type EditorPhase = "initializing" | "ready" | "error";

function ToolbarSkeleton() {
  return (
    <div className="flex flex-wrap gap-1 border-b border-zinc-100 px-2 py-2">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="h-8 w-8 animate-pulse rounded-md bg-zinc-100" />
      ))}
    </div>
  );
}

export function KnowledgeTiptapEditorInner({ locale, value, onChange, onNotify }: Props) {
  const zh = locale === "zh";
  const [phase, setPhase] = useState<EditorPhase>("initializing");
  const [initError, setInitError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [instanceKey, setInstanceKey] = useState(0);

  const mountRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const lastEmitted = useRef(value);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  valueRef.current = value;
  onChangeRef.current = onChange;

  const extensions = useMemo(() => createKnowledgeEditorExtensions(locale), [locale, instanceKey]);
  const initialContent = useMemo(
    () => normalizeKnowledgeEditorContent(valueRef.current),
    [instanceKey]
  );

  const reportError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    setInitError(message);
    setPhase("error");
  }, []);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) {
      reportError(new Error("Editor mount element is null"));
      return;
    }

    let instance: Editor | null = null;
    setPhase("initializing");
    setInitError(null);
    setEditor(null);

    try {
      instance = new Editor({
        element: mountNode,
        extensions,
        content: initialContent,
        autofocus: false,
        editorProps: {
          attributes: {
            class: "knowledge-editor-content knowledge-rich-editor prose-vincis min-h-[420px] outline-none"
          },
          handlePaste: (_view, event) => {
            const current = editorRef.current;
            if (!current || current.isDestroyed) return false;
            const html = event.clipboardData?.getData("text/html");
            const text = event.clipboardData?.getData("text/plain");
            if (html) {
              event.preventDefault();
              current.commands.insertContent(sanitizeKnowledgePastedHtml(html));
              return true;
            }
            if (text) {
              event.preventDefault();
              current.commands.insertContent(normalizeKnowledgePastedText(text).replace(/\n/g, "<br>"));
              return true;
            }
            return false;
          }
        },
        onUpdate: ({ editor: current }) => {
          const html = current.getHTML();
          lastEmitted.current = html;
          onChangeRef.current(html);
        }
      });

      editorRef.current = instance;
      lastEmitted.current = instance.getHTML();
      setEditor(instance);
      setPhase("ready");
    } catch (error) {
      reportError(error);
      return;
    }

    return () => {
      instance?.destroy();
      editorRef.current = null;
      setEditor(null);
    };
  }, [extensions, initialContent, instanceKey, reportError]);

  useEffect(() => {
    const current = editorRef.current;
    if (!current || current.isDestroyed || phase !== "ready") return;
    if (value === lastEmitted.current) return;
    if (value === current.getHTML()) return;
    try {
      current.commands.setContent(normalizeKnowledgeEditorContent(value), false);
      lastEmitted.current = value;
    } catch (error) {
      reportError(error);
    }
  }, [phase, reportError, value]);

  const reloadEditor = useCallback(() => {
    editorRef.current?.destroy();
    editorRef.current = null;
    setEditor(null);
    setInitError(null);
    setPhase("initializing");
    setInstanceKey((current) => current + 1);
  }, []);

  const ready = phase === "ready" && editor && !editor.isDestroyed;
  const chars = ready
    ? knowledgeEditorPlainTextLength(editor.getHTML())
    : knowledgeEditorPlainTextLength(value);

  return (
    <section
      data-editor-implementation="tiptap-v2"
      data-editor-phase={phase}
      className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
    >
      <header className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-base font-semibold text-zinc-900">{zh ? "正文" : "Body"}</h2>
        <p className="mt-1 text-xs text-zinc-500">
          {zh
            ? "支持标题、列表、表格、图片、YouTube、代码块等富文本格式。"
            : "Headings, lists, tables, images, YouTube, code blocks, and more."}
        </p>
      </header>

      {ready ? (
        <KnowledgeTiptapToolbar editor={editor} zh={zh} onNotify={onNotify} />
      ) : phase === "error" ? null : (
        <ToolbarSkeleton />
      )}

      <div className={cn("knowledge-rich-editor knowledge-rich-editor--fill relative min-h-[420px] flex-1")}>
        {phase === "initializing" ? (
          <p className="pointer-events-none absolute left-6 top-5 z-10 text-sm text-zinc-400">
            {zh ? "编辑器初始化中…" : "Initializing editor…"}
          </p>
        ) : null}

        {phase === "error" && initError ? (
          <KnowledgeTiptapEditorError zh={zh} message={initError} onReload={reloadEditor} />
        ) : null}

        <div
          ref={mountRef}
          key={instanceKey}
          className={cn("min-h-[420px] flex-1 px-6 py-5", phase === "error" && "hidden")}
        />
      </div>

      <footer className="flex flex-wrap gap-3 border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500">
        <span>
          {zh ? "字符数" : "Chars"}: {ready ? chars : "—"}
        </span>
      </footer>
    </section>
  );
}
