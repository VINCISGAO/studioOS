"use client";

export function KnowledgeTiptapEditorLoading() {
  return (
    <section
      data-editor-source="knowledge-tiptap-editor-loading.tsx"
      data-editor-phase="chunk-loading"
      className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
    >
      <header className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-base font-semibold text-zinc-900">正文</h2>
        <p className="mt-1 text-xs text-zinc-500">编辑器模块加载中…</p>
      </header>
      <div className="flex flex-wrap gap-1 border-b border-zinc-100 px-2 py-2">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="h-8 w-8 animate-pulse rounded-md bg-zinc-100" />
        ))}
      </div>
      <div className="min-h-[420px] flex-1 px-6 py-5" />
      <footer className="flex flex-wrap gap-3 border-t border-zinc-100 px-4 py-3 text-xs text-zinc-400">
        <span>字符数: —</span>
      </footer>
    </section>
  );
}
