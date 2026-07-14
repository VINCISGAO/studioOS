"use client";

import { renderKnowledgeMarkdown } from "@/lib/knowledge/knowledge-markdown";
import {
  knowledgeEditorCharCount,
  knowledgeEditorReadingTimeLabel,
  knowledgeEditorWordCount
} from "@/lib/knowledge/knowledge-editor-stats";
import {
  knowledgeMarkdownModeLabel,
  knowledgeMarkdownToolbarLabel
} from "@/lib/knowledge/knowledge-editor-copy";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type EditorMode = "markdown" | "split" | "preview";

type Props = {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  lastSavedLabel?: string | null;
};

function wrapSelection(text: string, start: number, end: number, before: string, after = before) {
  const selected = text.slice(start, end);
  return {
    next: `${text.slice(0, start)}${before}${selected}${after}${text.slice(end)}`,
    cursor: start + before.length + selected.length + after.length
  };
}

function prefixLines(text: string, start: number, end: number, prefix: string) {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);
  const nextSelected = selected
    .split("\n")
    .map((line) => (line.startsWith(prefix) ? line : `${prefix}${line}`))
    .join("\n");
  return {
    next: `${before}${nextSelected}${after}`,
    cursor: start + nextSelected.length
  };
}

export function KnowledgeMarkdownEditor({ locale, value, onChange, lastSavedLabel }: Props) {
  const zh = locale === "zh";
  const [mode, setMode] = useState<EditorMode>("split");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyWrap = useCallback(
    (before: string, after?: string) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const result = wrapSelection(value, start, end, before, after);
      onChange(result.next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(result.cursor, result.cursor);
      });
    },
    [onChange, value]
  );

  const applyPrefix = useCallback(
    (prefix: string) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const result = prefixLines(value, start, end, prefix);
      onChange(result.next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(result.cursor, result.cursor);
      });
    },
    [onChange, value]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "b") {
        event.preventDefault();
        applyWrap("**");
      }
      if (key === "k") {
        event.preventDefault();
        applyWrap("[", "](https://)");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [applyWrap]);

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 px-3 py-2">
      <ToolbarButton icon={Heading1} label={knowledgeMarkdownToolbarLabel("h1", zh)} onClick={() => applyPrefix("# ")} />
      <ToolbarButton icon={Heading2} label={knowledgeMarkdownToolbarLabel("h2", zh)} onClick={() => applyPrefix("## ")} />
      <ToolbarButton icon={Heading3} label={knowledgeMarkdownToolbarLabel("h3", zh)} onClick={() => applyPrefix("### ")} />
      <ToolbarButton icon={Bold} label={knowledgeMarkdownToolbarLabel("bold", zh)} onClick={() => applyWrap("**")} />
      <ToolbarButton icon={Italic} label={knowledgeMarkdownToolbarLabel("italic", zh)} onClick={() => applyWrap("*")} />
      <ToolbarButton icon={Quote} label={knowledgeMarkdownToolbarLabel("quote", zh)} onClick={() => applyPrefix("> ")} />
      <ToolbarButton icon={Code} label={knowledgeMarkdownToolbarLabel("code", zh)} onClick={() => applyWrap("`")} />
      <ToolbarButton icon={List} label={knowledgeMarkdownToolbarLabel("list", zh)} onClick={() => applyPrefix("- ")} />
      <ToolbarButton icon={ListOrdered} label={knowledgeMarkdownToolbarLabel("ordered", zh)} onClick={() => applyPrefix("1. ")} />
      <ToolbarButton icon={Link2} label={knowledgeMarkdownToolbarLabel("link", zh)} onClick={() => applyWrap("[", "](https://)")} />
      <ToolbarButton icon={ImageIcon} label={knowledgeMarkdownToolbarLabel("image", zh)} onClick={() => applyWrap("![alt](", ")")} />
      <ToolbarButton icon={Minus} label={knowledgeMarkdownToolbarLabel("divider", zh)} onClick={() => onChange(`${value}\n\n---\n`)} />
      <div className="ml-auto flex rounded-lg border border-zinc-200 p-0.5 text-xs">
        {(["markdown", "split", "preview"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={cn(
              "rounded-md px-2.5 py-1 font-medium transition",
              mode === item ? "bg-[#5B5CEB] text-white" : "text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {knowledgeMarkdownModeLabel(item, zh)}
          </button>
        ))}
      </div>
    </div>
  );

  const editorPane = (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      spellCheck
      className="min-h-[420px] w-full resize-y border-0 bg-transparent px-4 py-4 font-mono text-[15px] leading-7 text-zinc-900 outline-none"
      aria-label={zh ? "Markdown 编辑器" : "Markdown editor"}
    />
  );

  const previewPane = (
    <div
      className="prose-vincis min-h-[420px] overflow-auto px-4 py-4"
      dangerouslySetInnerHTML={{ __html: renderKnowledgeMarkdown(value || `_${zh ? "暂无内容" : "No content yet"}_`) }}
    />
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-4 py-3">
        <p className="text-sm font-semibold text-zinc-900">{zh ? "Markdown 内容" : "Markdown Content"} *</p>
      </div>
      {toolbar}
      {mode === "markdown" ? (
        editorPane
      ) : mode === "preview" ? (
        previewPane
      ) : (
        <div className="grid min-h-[420px] lg:grid-cols-2">
          <div className="border-r border-zinc-100">{editorPane}</div>
          {previewPane}
        </div>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500">
        <div className="flex flex-wrap gap-4">
          <span>{zh ? "字数" : "Words"}: {knowledgeEditorWordCount(value)}</span>
          <span>{zh ? "字符" : "Chars"}: {knowledgeEditorCharCount(value)}</span>
          <span>{zh ? "阅读时间" : "Reading"}: {knowledgeEditorReadingTimeLabel(value, zh)}</span>
        </div>
        {lastSavedLabel ? <span>{lastSavedLabel}</span> : null}
      </footer>
    </section>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
