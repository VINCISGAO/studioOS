"use client";

import {
  ClipboardPaste,
  Copy,
  CopyPlus,
  Rows3,
  Scissors,
  Trash2
} from "lucide-react";
import { useCanvasStore } from "@/components/canvas/canvas-store";

function SelectionAction({
  label,
  disabled,
  onClick,
  children,
  destructive
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={
        destructive
          ? "rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
          : "rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-30"
      }
    >
      {children}
    </button>
  );
}

export function SelectionToolbar({ onPaste }: { onPaste: () => void }) {
  const nodes = useCanvasStore((state) => state.nodes);
  const selectedNodeIds = nodes.filter((node) => node.selected).map((node) => node.id);
  const clipboardNodes = useCanvasStore((state) => state.clipboardNodes);
  const copySelected = useCanvasStore((state) => state.copySelected);
  const cutSelected = useCanvasStore((state) => state.cutSelected);
  const duplicateSelected = useCanvasStore((state) => state.duplicateSelected);
  const deleteSelected = useCanvasStore((state) => state.deleteSelected);
  const autoLayout = useCanvasStore((state) => state.autoLayout);

  if (!selectedNodeIds.length) return null;

  const canPaste = clipboardNodes.length > 0 || selectedNodeIds.length > 0;

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2">
      <div className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-0.5 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
        <span className="shrink-0 px-2 text-[11px] font-medium text-zinc-400">
          {selectedNodeIds.length} 项
        </span>
        <SelectionAction label="复制" onClick={copySelected}>
          <Copy className="h-4 w-4" />
        </SelectionAction>
        <SelectionAction label="剪切" onClick={cutSelected}>
          <Scissors className="h-4 w-4" />
        </SelectionAction>
        <SelectionAction label="粘贴" disabled={!canPaste} onClick={onPaste}>
          <ClipboardPaste className="h-4 w-4" />
        </SelectionAction>
        <SelectionAction label="创建副本" onClick={duplicateSelected}>
          <CopyPlus className="h-4 w-4" />
        </SelectionAction>
        <SelectionAction label="自动布局" onClick={autoLayout}>
          <Rows3 className="h-4 w-4" />
        </SelectionAction>
        <span className="mx-0.5 h-5 w-px shrink-0 bg-zinc-200" />
        <SelectionAction label="删除" destructive onClick={deleteSelected}>
          <Trash2 className="h-4 w-4" />
        </SelectionAction>
      </div>
    </div>
  );
}
