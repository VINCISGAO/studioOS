"use client";

import {
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

function isNodeMenuReady(data: CanvasNodeData, variant: CanvasMediaNodeMenuVariant) {
  const hasMedia = Boolean(data.url || data.assetId);
  if (variant === "upload") return hasMedia;
  return data.status === "ready" && hasMedia;
}

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
  const isImage = variant === "image";
  const isReady = isNodeMenuReady(data, variant);

  if (!selected || !isReady) return null;

  return (
    <NodeToolbar
      isVisible
      position={Position.Right}
      offset={12}
      className="!border-0 !bg-transparent !p-0 !shadow-none"
    >
      <div className="min-w-[148px] rounded-[20px] border border-zinc-200 bg-white p-1.5 shadow-xl">
        {isImage ? (
          <MenuItem
            label="放大"
            icon={<Scan className="h-4 w-4 shrink-0" />}
            onClick={() => actions?.upscale(nodeId)}
          />
        ) : null}
        {isImage ? (
          <MenuItem
            label="去除背景"
            icon={<Eraser className="h-4 w-4 shrink-0" />}
            onClick={() => actions?.removeBackground(nodeId)}
          />
        ) : null}
        {isImage ? (
          <MenuItem
            label="画同款"
            icon={<Sparkles className="h-4 w-4 shrink-0" />}
            disabled={!data.prompt}
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
