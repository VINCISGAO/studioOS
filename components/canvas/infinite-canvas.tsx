"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Redo2, Undo2 } from "lucide-react";
import {
  Background,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  type NodeTypes
} from "@xyflow/react";
import { CanvasNavigatorDock } from "@/components/canvas/canvas-navigator-dock";
import { CanvasNodeContextMenu } from "@/components/canvas/canvas-node-context-menu";
import { CanvasPaneContextMenu } from "@/components/canvas/canvas-pane-context-menu";
import { CanvasViewportEmptyHint } from "@/components/canvas/canvas-viewport-empty-hint";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import { useCanvasAutosave } from "@/components/canvas/hooks/use-canvas-autosave";
import { useCanvasShortcuts } from "@/components/canvas/hooks/use-canvas-shortcuts";
import { useCanvasViewportActions } from "@/components/canvas/hooks/use-canvas-viewport-actions";
import { useCanvasViewportContent } from "@/components/canvas/hooks/use-canvas-viewport-content";
import { useGenerationEvents } from "@/components/canvas/hooks/use-generation-events";
import { ImageNode } from "@/components/canvas/nodes/image-node";
import { FrameNode } from "@/components/canvas/nodes/frame-node";
import { LoadingNode } from "@/components/canvas/nodes/loading-node";
import { MusicNode } from "@/components/canvas/nodes/music-node";
import { TextNode } from "@/components/canvas/nodes/text-node";
import { UploadNode } from "@/components/canvas/nodes/upload-node";
import { VideoNode } from "@/components/canvas/nodes/video-node";
import { isDarkCanvasBackground } from "@/lib/canvas/color";
import {
  buildChatImageCanvasNode,
  isChatImageDragEvent,
  readChatImageDragData
} from "@/lib/canvas/chat-image-canvas";
import { viewportCenterFlowPoint } from "@/lib/canvas/viewport-anchor";
import { isCanvasMediaNode } from "@/lib/canvas/node-interaction";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import "@/components/canvas/canvas-flow.css";

const nodeTypes: NodeTypes = {
  image: ImageNode,
  video: VideoNode,
  music: MusicNode,
  text: TextNode,
  frame: FrameNode,
  upload: UploadNode,
  loading: LoadingNode
};

type ContextMenuState = {
  x: number;
  y: number;
  flowPosition: { x: number; y: number };
};

type NodeContextMenuState = ContextMenuState & {
  targetNodeId: string;
};

function InfiniteCanvasFlow({
  projectId,
  locale,
  onCanvasPointerDown,
  onNodeClick
}: {
  projectId: string;
  locale: Locale;
  onCanvasPointerDown?: () => void;
  onNodeClick?: (node: VincisCanvasNode) => void;
}) {
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const viewport = useCanvasStore((state) => state.viewport);
  const canvasBackgroundColor = useCanvasStore((state) => state.canvasBackgroundColor);
  const onNodesChange = useCanvasStore((state) => state.onNodesChange);
  const onEdgesChange = useCanvasStore((state) => state.onEdgesChange);
  const connect = useCanvasStore((state) => state.connect);
  const setViewport = useCanvasStore((state) => state.setViewport);
  const interactionMode = useCanvasStore((state) => state.interactionMode);
  const clipboardNodes = useCanvasStore((state) => state.clipboardNodes);
  const selectedNodeIds = useCanvasStore((state) => state.selectedNodeIds);
  const pasteAt = useCanvasStore((state) => state.pasteAt);
  const addNode = useCanvasStore((state) => state.addNode);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const flowRef = useRef<HTMLDivElement>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [nodeContextMenu, setNodeContextMenu] = useState<NodeContextMenuState | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  const { handleZoomIn, handleZoomOut, handleFitView, handleZoom100 } =
    useCanvasViewportActions();
  const { showEmptyHint } = useCanvasViewportContent(flowRef);

  useCanvasAutosave();
  useGenerationEvents(projectId);

  const isMoveMode = interactionMode === "move";
  const canPaste = clipboardNodes.length > 0 || selectedNodeIds.length > 0;
  const dotColor = isDarkCanvasBackground(canvasBackgroundColor) ? "#5a5a58" : "#dededb";

  const pasteAtCenter = useCallback(() => {
    const rect = flowRef.current?.getBoundingClientRect();
    if (!rect) return;
    pasteAt(
      viewportCenterFlowPoint(useCanvasStore.getState().viewport, {
        width: rect.width,
        height: rect.height
      })
    );
  }, [pasteAt]);

  const shortcutHandlers = useMemo(
    () => ({
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      fitView: handleFitView,
      zoom100: handleZoom100,
      pasteAtCenter
    }),
    [handleFitView, handleZoom100, handleZoomIn, handleZoomOut, pasteAtCenter]
  );

  useCanvasShortcuts(shortcutHandlers);

  const openContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      setNodeContextMenu(null);
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowPosition: screenToFlowPosition({ x: event.clientX, y: event.clientY })
      });
    },
    [screenToFlowPosition]
  );

  const openNodeContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent, node: VincisCanvasNode) => {
      if (!isCanvasMediaNode(node)) return;
      event.preventDefault();
      event.stopPropagation();
      if ("nativeEvent" in event) {
        event.nativeEvent.stopPropagation();
      }
      setContextMenu(null);
      const state = useCanvasStore.getState();
      if (!state.selectedNodeIds.includes(node.id)) {
        onNodesChange(
          state.nodes.map((item) => ({
            type: "select",
            id: item.id,
            selected: item.id === node.id
          }))
        );
      }
      setNodeContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowPosition: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
        targetNodeId: node.id
      });
    },
    [onNodesChange, screenToFlowPosition]
  );

  const handleChatImageDragOver = useCallback((event: React.DragEvent) => {
    if (isChatImageDragEvent(event.dataTransfer)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleChatImageDrop = useCallback(
    (event: React.DragEvent) => {
      const payload = readChatImageDragData(event.dataTransfer);
      if (!payload) return;
      event.preventDefault();
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(buildChatImageCanvasNode(payload, position));
    },
    [addNode, screenToFlowPosition]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: VincisCanvasNode) => {
      if (onNodeClick) {
        onNodeClick(node);
        return;
      }
      onCanvasPointerDown?.();
    },
    [onCanvasPointerDown, onNodeClick]
  );

  return (
    <div
      ref={flowRef}
      className={cn("canvas-flow absolute inset-0", isMoveMode ? "mode-move" : "mode-select")}
      style={{ backgroundColor: canvasBackgroundColor }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={connect}
        onMove={(_event, nextViewport) => setViewport(nextViewport)}
        onMoveEnd={(_event, nextViewport) => setViewport(nextViewport)}
        onPaneClick={isMoveMode ? undefined : onCanvasPointerDown}
        onNodeClick={isMoveMode ? undefined : handleNodeClick}
        onPaneContextMenu={openContextMenu}
        onNodeContextMenu={openNodeContextMenu}
        onDragOver={handleChatImageDragOver}
        onDrop={handleChatImageDrop}
        viewport={viewport}
        onViewportChange={setViewport}
        minZoom={0.08}
        maxZoom={4}
        selectionOnDrag={!isMoveMode}
        selectionKeyCode={null}
        panOnDrag={isMoveMode ? true : [1, 2]}
        panActivationKeyCode={isMoveMode ? null : "Space"}
        panOnScroll
        multiSelectionKeyCode={["Meta", "Control", "Shift"]}
        nodesDraggable={!isMoveMode}
        elementsSelectable={!isMoveMode}
        deleteKeyCode={null}
        elevateNodesOnSelect
        fitView={!nodes.length}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={28} size={1} color={dotColor} />
        {showMinimap ? (
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            className="!bottom-[4.75rem] !right-4 !h-28 !w-44 !overflow-hidden !rounded-2xl !border !border-zinc-200 !bg-white !shadow-md"
            nodeColor="#a1a1aa"
            maskColor="rgba(255,255,255,0.72)"
          />
        ) : null}
        <Panel position="bottom-right" className="!m-0 !mb-4 !mr-4">
          <CanvasNavigatorDock
            locale={locale}
            showMinimap={showMinimap}
            onToggleMinimap={() => setShowMinimap((value) => !value)}
          />
        </Panel>
      </ReactFlow>

      {nodeContextMenu ? (
        <CanvasNodeContextMenu
          x={nodeContextMenu.x}
          y={nodeContextMenu.y}
          flowPosition={nodeContextMenu.flowPosition}
          targetNodeId={nodeContextMenu.targetNodeId}
          onClose={() => setNodeContextMenu(null)}
        />
      ) : null}

      {contextMenu ? (
        <CanvasPaneContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          canPaste={canPaste}
          onClose={() => setContextMenu(null)}
          onPaste={() => pasteAt(contextMenu.flowPosition)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onZoom100={handleZoom100}
        />
      ) : null}

      {showEmptyHint ? (
        <CanvasViewportEmptyHint locale={locale} onBackToContent={handleFitView} />
      ) : null}

      <div className="absolute bottom-4 left-4 z-20 flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
        <button
          type="button"
          onClick={undo}
          title="撤销 (⌘Z)"
          className="border-r border-zinc-100 p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={redo}
          title="重做 (⇧⌘Z)"
          className="p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function InfiniteCanvas({
  projectId,
  locale,
  onCanvasPointerDown,
  onNodeClick
}: {
  projectId: string;
  locale: Locale;
  onCanvasPointerDown?: () => void;
  onNodeClick?: (node: VincisCanvasNode) => void;
}) {
  return (
    <InfiniteCanvasFlow
      projectId={projectId}
      locale={locale}
      onCanvasPointerDown={onCanvasPointerDown}
      onNodeClick={onNodeClick}
    />
  );
}
