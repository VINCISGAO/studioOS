"use client";

type Props = {
  zh: boolean;
  message: string;
  onReload: () => void;
};

export function KnowledgeTiptapEditorError({ zh, message, onReload }: Props) {
  return (
    <div className="mx-6 my-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
      <p className="font-semibold">{zh ? "编辑器初始化失败" : "Editor failed to initialize"}</p>
      <p className="mt-2 break-all font-mono text-xs text-rose-800">{message}</p>
      <button
        type="button"
        onClick={onReload}
        className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
      >
        {zh ? "重新加载编辑器" : "Reload editor"}
      </button>
    </div>
  );
}
