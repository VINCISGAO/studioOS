"use client";

import {
  Clock3,
  Download,
  Scan,
  Sparkles,
  UserRound
} from "lucide-react";
import { NodeToolbar, Position } from "@xyflow/react";
import type { CanvasNodeData } from "@/lib/canvas/types";
import { canDownloadCanvasNode, resolveCanvasNodeDownloadHref } from "@/lib/canvas/node-download";
import { cn } from "@/lib/utils";

function IconButton({
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
    "flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition",
    disabled ? "cursor-not-allowed opacity-30" : "hover:bg-zinc-100 hover:text-zinc-900"
  );

  if (href && !disabled) {
    return (
      <a href={href} className={className} download aria-label={label} title={label}>
        {icon}
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
    </button>
  );
}

function dispatchNodeAction(action: "extend-video" | "regenerate", nodeId: string) {
  window.dispatchEvent(new CustomEvent("canvas:node-action", { detail: { action, nodeId } }));
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
  variant?: "video" | "upload";
}) {
  const downloadHref = resolveCanvasNodeDownloadHref(data);
  const canDownload = canDownloadCanvasNode(data);
  const canRegenerate = variant === "video" && Boolean(data.prompt) && data.status === "ready";
  const canExtend = variant === "video" && Boolean(data.prompt) && data.status === "ready";

  return (
    <NodeToolbar
      isVisible={selected}
      position={Position.Right}
      offset={12}
      className="!border-0 !bg-transparent !p-0 !shadow-none"
    >
      <div className="flex flex-col gap-1 rounded-[20px] border border-zinc-200 bg-white p-1.5 shadow-xl">
        <IconButton label="高清" icon={<Scan className="h-4 w-4" />} disabled />
        <IconButton label="主体" icon={<UserRound className="h-4 w-4" />} disabled />
        <IconButton
          label="延长"
          icon={<Clock3 className="h-4 w-4" />}
          disabled={!canExtend}
          onClick={() => dispatchNodeAction("extend-video", nodeId)}
        />
        <IconButton
          label="画同款"
          icon={<Sparkles className="h-4 w-4" />}
          disabled={!canRegenerate}
          onClick={() => dispatchNodeAction("regenerate", nodeId)}
        />
        <IconButton
          label="下载"
          icon={<Download className="h-4 w-4" />}
          disabled={!canDownload}
          href={downloadHref}
        />
      </div>
    </NodeToolbar>
  );
}
