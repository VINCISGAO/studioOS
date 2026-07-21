"use client";

import {
  Archive,
  AlignHorizontalSpaceAround,
  ArrowRightFromLine,
  Copy,
  Download,
  Frame,
  RefreshCcw,
  Rows3,
  Trash2,
  Video
} from "lucide-react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import { canDownloadCanvasNode, resolveCanvasNodeDownloadHref } from "@/lib/canvas/node-download";

function SelectionAction({
  label,
  disabled,
  onClick,
  children
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

export function SelectionToolbar({
  onRegenerate,
  onImageToVideo,
  onExtendVideo
}: {
  onRegenerate: (nodeId: string) => void;
  onImageToVideo: (nodeId: string) => void;
  onExtendVideo: (nodeId: string) => void;
}) {
  const nodes = useCanvasStore((state) => state.nodes);
  const selectedNodeIds = useCanvasStore((state) => state.selectedNodeIds);
  const duplicateSelected = useCanvasStore((state) => state.duplicateSelected);
  const deleteSelected = useCanvasStore((state) => state.deleteSelected);
  const autoLayout = useCanvasStore((state) => state.autoLayout);
  const alignSelected = useCanvasStore((state) => state.alignSelected);
  const sortSelected = useCanvasStore((state) => state.sortSelected);
  const groupSelectedInFrame = useCanvasStore((state) => state.groupSelectedInFrame);
  const selected = nodes.find((node) => node.id === selectedNodeIds[0]);

  if (!selectedNodeIds.length) return null;
  const oneSelected = selectedNodeIds.length === 1 && selected;
  const canRegenerate = Boolean(oneSelected && selected.data.prompt);
  const canImageToVideo = Boolean(oneSelected && selected.type === "image");
  const canExtendVideo = Boolean(oneSelected && selected.type === "video");

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2">
      <div className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-0.5 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
        <span className="px-2 text-[11px] font-medium text-zinc-400">
          {selectedNodeIds.length} 项
        </span>
        <SelectionAction label="复制" onClick={duplicateSelected}>
          <Copy className="h-4 w-4" />
        </SelectionAction>
        <SelectionAction label="自动布局" onClick={autoLayout}>
          <Rows3 className="h-4 w-4" />
        </SelectionAction>
        <SelectionAction label="对齐" disabled={selectedNodeIds.length < 2} onClick={alignSelected}>
          <AlignHorizontalSpaceAround className="h-4 w-4" />
        </SelectionAction>
        <SelectionAction label="排序" disabled={selectedNodeIds.length < 2} onClick={sortSelected}>
          <ArrowRightFromLine className="h-4 w-4" />
        </SelectionAction>
        <SelectionAction label="创建 Frame 分组" onClick={groupSelectedInFrame}>
          <Frame className="h-4 w-4" />
        </SelectionAction>
        <SelectionAction
          label="再次生成"
          disabled={!canRegenerate}
          onClick={() => selected && onRegenerate(selected.id)}
        >
          <RefreshCcw className="h-4 w-4" />
        </SelectionAction>
        <SelectionAction
          label="图生视频"
          disabled={!canImageToVideo}
          onClick={() => selected && onImageToVideo(selected.id)}
        >
          <Video className="h-4 w-4" />
        </SelectionAction>
        <SelectionAction
          label="视频延长"
          disabled={!canExtendVideo}
          onClick={() => selected && onExtendVideo(selected.id)}
        >
          <ArrowRightFromLine className="h-4 w-4" />
        </SelectionAction>
        {oneSelected && canDownloadCanvasNode(selected.data) ? (
          <a
            href={resolveCanvasNodeDownloadHref(selected.data) ?? "#"}
            title="下载"
            aria-label="下载"
            className="rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            <Download className="h-4 w-4" />
          </a>
        ) : (
          <SelectionAction label="下载" disabled>
            <Download className="h-4 w-4" />
          </SelectionAction>
        )}
        <SelectionAction label="已保存到项目素材库" disabled={!selected?.data.assetId}>
          <Archive className="h-4 w-4" />
        </SelectionAction>
        <span className="mx-0.5 h-5 w-px bg-zinc-200" />
        <SelectionAction label="删除" onClick={deleteSelected}>
          <Trash2 className="h-4 w-4 text-rose-500" />
        </SelectionAction>
      </div>
    </div>
  );
}
