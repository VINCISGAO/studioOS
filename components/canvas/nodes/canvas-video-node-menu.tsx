"use client";

import {
  Clock3,
  Download,
  Eraser,
  Scan,
  Sparkles
} from "lucide-react";
import { NodeToolbar, Position } from "@xyflow/react";
import type { CanvasNodeData } from "@/lib/canvas/types";
import { useCanvasNodeActions } from "@/components/canvas/canvas-node-actions-context";
import { canDownloadCanvasNode, resolveCanvasNodeDownloadHref } from "@/lib/canvas/node-download";
import { cn } from "@/lib/utils";

function MenuItem({
  label,
  icon,
  disabled,
  onClick,
  href
}: {
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  href?: string | null;
}) {
  const className = cn(
    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-zinc-700 transition",
    disabled ? "cursor-not-allowed opacity-35" : "hover:bg-zinc-100 hover:text-zinc-950"
  );

  if (href && !disabled) {
    return (
      <a href={href} className={className} download aria-label={label} title={label}>
        {icon}
        <span>{label}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={className}
      aria-label={label}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export type CanvasMediaNodeMenuVariant = "video" | "image" | "music" | "upload";

export function CanvasVideoNodeMenu({
  nodeId,
  data,
  selected,
  variant = "video"
}: {
  nodeId: string;
  data: CanvasNodeData;
  selected: boolean;
  variant?: CanvasMediaNodeMenuVariant;
}) {
  const actions = useCanvasNodeActions();
  const downloadHref = resolveCanvasNodeDownloadHref(data);
  const canDownload = canDownloadCanvasNode(data);
  const isVideo = variant === "video";
  const isImage = variant === "image";
  const hasAsset = Boolean(data.assetId);
  const isReady = data.status === "ready" && hasAsset;
  const canRegenerate = variant !== "upload" && Boolean(data.prompt) && isReady;
  const canExtend = isVideo && isReady;
  const canUpscale = (isImage || isVideo) && isReady;
  const canRemoveBackground = isImage && isReady;

  return (
    <NodeToolbar
      isVisible={selected}
      position={Position.Right}
      offset={12}
      className="!border-0 !bg-transparent !p-0 !shadow-none"
    >
      <div className="min-w-[148px] rounded-[20px] border border-zinc-200 bg-white p-1.5 shadow-xl">
        {canUpscale ? (
          <MenuItem
            label="放大"
            icon={<Scan className="h-4 w-4 shrink-0" />}
            disabled={!canUpscale}
            onClick={() => actions?.upscale(nodeId)}
          />
        ) : null}
        {isImage ? (
          <MenuItem
            label="去除背景"
            icon={<Eraser className="h-4 w-4 shrink-0" />}
            disabled={!canRemoveBackground}
            onClick={() => actions?.removeBackground(nodeId)}
          />
        ) : null}
        {isVideo ? (
          <MenuItem
            label="视频延长"
            icon={<Clock3 className="h-4 w-4 shrink-0" />}
            disabled={!canExtend}
            onClick={() => actions?.extendVideo(nodeId)}
          />
        ) : null}
        {variant !== "upload" ? (
          <MenuItem
            label="画同款"
            icon={<Sparkles className="h-4 w-4 shrink-0" />}
            disabled={!canRegenerate}
            onClick={() => actions?.regenerate(nodeId)}
          />
        ) : null}
        <MenuItem
          label="下载"
          icon={<Download className="h-4 w-4 shrink-0" />}
          disabled={!canDownload}
          href={downloadHref}
        />
      </div>
    </NodeToolbar>
  );
}
