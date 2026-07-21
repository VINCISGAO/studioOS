"use client";

import { useMemo } from "react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import {
  CanvasContextMenuShell,
  shortcutMod,
  type CanvasContextMenuItem
} from "@/components/canvas/canvas-context-menu-shell";
import {
  dispatchCanvasSendToChat,
  resolveCanvasNodeChatReference
} from "@/lib/canvas/canvas-chat-bridge";
import { isCanvasMediaNode } from "@/lib/canvas/node-interaction";
import {
  canDownloadCanvasNode,
  resolveCanvasNodeDownloadHref
} from "@/lib/canvas/node-download";
import type { VincisCanvasNode } from "@/lib/canvas/types";

function selectedMediaNodes(nodes: VincisCanvasNode[], selectedNodeIds: string[]) {
  const selected = new Set(selectedNodeIds);
  return nodes.filter((node) => selected.has(node.id) && isCanvasMediaNode(node));
}

export function CanvasNodeContextMenu({
  x,
  y,
  flowPosition,
  targetNodeId,
  onClose
}: {
  x: number;
  y: number;
  flowPosition: { x: number; y: number };
  targetNodeId: string;
  onClose: () => void;
}) {
  const mod = shortcutMod();
  const nodes = useCanvasStore((state) => state.nodes);
  const selectedNodeIds = useCanvasStore((state) => state.selectedNodeIds);
  const clipboardNodes = useCanvasStore((state) => state.clipboardNodes);
  const copySelected = useCanvasStore((state) => state.copySelected);
  const cutSelected = useCanvasStore((state) => state.cutSelected);
  const pasteAt = useCanvasStore((state) => state.pasteAt);
  const duplicateSelected = useCanvasStore((state) => state.duplicateSelected);
  const bringForward = useCanvasStore((state) => state.bringForward);
  const sendBackward = useCanvasStore((state) => state.sendBackward);
  const bringToFront = useCanvasStore((state) => state.bringToFront);
  const sendToBack = useCanvasStore((state) => state.sendToBack);
  const groupSelectedInFrame = useCanvasStore((state) => state.groupSelectedInFrame);
  const ungroupSelected = useCanvasStore((state) => state.ungroupSelected);
  const autoLayoutSelected = useCanvasStore((state) => state.autoLayoutSelected);
  const mergeSelectedLayers = useCanvasStore((state) => state.mergeSelectedLayers);
  const toggleSelectedHidden = useCanvasStore((state) => state.toggleSelectedHidden);
  const toggleSelectedLocked = useCanvasStore((state) => state.toggleSelectedLocked);
  const deleteSelected = useCanvasStore((state) => state.deleteSelected);

  const mediaSelection = useMemo(
    () => selectedMediaNodes(nodes, selectedNodeIds),
    [nodes, selectedNodeIds]
  );
  const primaryNode =
    mediaSelection.find((node) => node.id === targetNodeId) ?? mediaSelection[0] ?? null;
  const canPaste = clipboardNodes.length > 0 || selectedNodeIds.length > 0;
  const hasSelection = selectedNodeIds.length > 0;
  const multiSelected = selectedNodeIds.length > 1;
  const allLocked = mediaSelection.every((node) => node.data.locked === true);
  const allHidden = mediaSelection.every((node) => node.data.hidden === true);
  const canGroup = mediaSelection.some((node) => !node.parentId && node.type !== "frame");
  const canUngroup = mediaSelection.some((node) => Boolean(node.parentId));
  const canMerge = mediaSelection.length >= 2;
  const canAutoLayout = selectedNodeIds.length >= 2;
  const canExport = primaryNode ? canDownloadCanvasNode(primaryNode.data) : false;
  const canSendToChat = primaryNode
    ? Boolean(resolveCanvasNodeChatReference(primaryNode.data))
    : false;

  const sections: CanvasContextMenuItem[][] = [
    [
      { id: "copy", label: "复制", shortcut: `${mod}C`, disabled: !hasSelection, onSelect: copySelected },
      { id: "cut", label: "剪切", shortcut: `${mod}X`, disabled: !hasSelection, onSelect: cutSelected },
      {
        id: "paste",
        label: "粘贴",
        shortcut: `${mod}V`,
        disabled: !canPaste,
        onSelect: () => pasteAt(flowPosition)
      },
      {
        id: "duplicate",
        label: "创建副本",
        shortcut: `${mod}D`,
        disabled: !hasSelection,
        onSelect: duplicateSelected
      }
    ],
    [
      {
        id: "forward",
        label: "上移一层",
        shortcut: `${mod}]`,
        disabled: !hasSelection,
        onSelect: bringForward
      },
      {
        id: "backward",
        label: "下移一层",
        shortcut: `${mod}[`,
        disabled: !hasSelection,
        onSelect: sendBackward
      },
      {
        id: "front",
        label: "移动至顶层",
        shortcut: "]",
        disabled: !hasSelection,
        onSelect: bringToFront
      },
      {
        id: "back",
        label: "移动至底层",
        shortcut: "[",
        disabled: !hasSelection,
        onSelect: sendToBack
      }
    ],
    [
      {
        id: "send-chat",
        label: "发送至对话",
        disabled: !canSendToChat,
        onSelect: () => {
          if (!primaryNode) return;
          const payload = resolveCanvasNodeChatReference(primaryNode.data);
          if (payload) dispatchCanvasSendToChat(payload);
        }
      }
    ],
    [
      {
        id: "group",
        label: "创建编组",
        shortcut: `${mod}G`,
        disabled: !canGroup,
        onSelect: groupSelectedInFrame
      },
      {
        id: "ungroup",
        label: "解除编组",
        shortcut: `${mod}⇧G`,
        disabled: !canUngroup,
        onSelect: ungroupSelected
      },
      {
        id: "auto-layout",
        label: "自动布局",
        shortcut: "⇧A",
        disabled: !canAutoLayout,
        onSelect: autoLayoutSelected
      },
      {
        id: "merge",
        label: "合并图层",
        shortcut: `${mod}E`,
        disabled: !canMerge,
        onSelect: mergeSelectedLayers
      }
    ],
    [
      {
        id: "hidden",
        label: allHidden ? "显示" : "显示/隐藏",
        shortcut: `${mod}⇧H`,
        disabled: !hasSelection,
        onSelect: toggleSelectedHidden
      },
      {
        id: "lock",
        label: allLocked ? "解锁" : "锁定/解锁",
        shortcut: `${mod}⇧L`,
        disabled: !hasSelection,
        onSelect: toggleSelectedLocked
      }
    ],
    [
      {
        id: "export",
        label: "导出",
        disabled: !canExport,
        onSelect: () => {
          if (!primaryNode) return;
          const href = resolveCanvasNodeDownloadHref(primaryNode.data);
          if (href) window.open(href, "_blank", "noopener,noreferrer");
        }
      }
    ],
    [
      {
        id: "delete",
        label: "删除",
        shortcut: "⌫",
        destructive: true,
        disabled: !hasSelection,
        onSelect: deleteSelected
      }
    ]
  ];

  if (!primaryNode && !multiSelected) return null;

  return <CanvasContextMenuShell x={x} y={y} sections={sections} onClose={onClose} />;
}
