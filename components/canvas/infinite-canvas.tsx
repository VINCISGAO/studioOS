"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Redo2, Undo2 } from "lucide-react";
import {
  Background,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes
} from "@xyflow/react";
import { CanvasNavigatorDock } from "@/components/canvas/canvas-navigator-dock";
import { CanvasViewportEmptyHint } from "@/components/canvas/canvas-viewport-empty-hint";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import { useCanvasAutosave } from "@/components/canvas/hooks/use-canvas-autosave";
import { useCanvasShortcuts } from "@/components/canvas/hooks/use-canvas-shortcuts";
import { useCanvasViewportActions } from "@/components/canvas/hooks/use-canvas-viewport-actions";
import { useCanvasViewportContent } from "@/components/canvas/hooks/use-canvas-viewport-content";
import { useGenerationEvents } from "@/components/canvas/hooks/use-generation-events";
import { useCanvasJobReconcile } from "@/components/canvas/hooks/use-canvas-job-reconcile";
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
import { readCanvasViewport, registerFlowViewportReader, viewportCenterFlowPoint } from "@/lib/canvas/viewport-anchor";
import type { GenerationJobEvent, VincisCanvasNode } from "@/lib/canvas/types";
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

function InfiniteCanvasFlow({
  projectId,
  locale,
  onCanvasPointerDown,
  onNodeClick,
  onGenerationTerminalFailure
}: {
  projectId: string;
  locale: Locale;
  onCanvasPointerDown?: () => void;
  onNodeClick?: (node: VincisCanvasNode) => void;
  onGenerationTerminalFailure?: (event: GenerationJobEvent) => void;
}) {
  const nodes = useCanvasStore((state) => state.nodes);
  const onNodesChange = useCanvasStore((state) => state.onNodesChange);
  const viewport = useCanvasStore((state) => state.viewport);
  const canvasBackgroundColor = useCanvasStore((state) => state.canvasBackgroundColor);
  const setViewport = useCanvasStore((state) => state.setViewport);
  const interactionMode = useCanvasStore((state) => state.interactionMode);
  const pasteAt = useCanvasStore((state) => state.pasteAt);
  const addNode = useCanvasStore((state) => state.addNode);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useCanvasStore((state) => state.past.length > 0);
  const canRedo = useCanvasStore((state) => state.future.length > 0);
  const flowRef = useRef<HTMLDivElement>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const { screenToFlowPosition, getViewport } = useReactFlow();
  const { handleZoomIn, handleZoomOut, handleFitView, handleZoom100 } =
    useCanvasViewportActions();
  const { showEmptyHint } = useCanvasViewportContent(flowRef);

  useEffect(() => {
    registerFlowViewportReader(getViewport);
    return () => registerFlowViewportReader(null);
  }, [getViewport]);

  useCanvasAutosave();
  useCanvasJobReconcile(projectId);
  useGenerationEvents(projectId, { onTerminalFailure: onGenerationTerminalFailure });

  const isMoveMode = interactionMode === "move";
  const dotColor = isDarkCanvasBackground(canvasBackgroundColor) ? "#5a5a58" : "#dededb";

  useEffect(() => {
    const container = flowRef.current;
    if (!container) return;
    const blockContextMenu = (event: Event) => event.preventDefault();
    container.addEventListener("contextmenu", blockContextMenu);
    return () => container.removeEventListener("contextmenu", blockContextMenu);
  }, []);

  const pasteAtCenter = useCallback(() => {
    const rect = flowRef.current?.getBoundingClientRect();
    if (!rect) return;
    pasteAt(
      viewportCenterFlowPoint(readCanvasViewport(useCanvasStore.getState().viewport), {
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

  const blockContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
  }, []);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: VincisCanvasNode) => {
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  return (
    <div
      ref={flowRef}
      className={cn(
        "canvas-flow absolute inset-0 z-[1]",
        isMoveMode ? "mode-move" : "mode-select"
      )}
      style={{ backgroundColor: canvasBackgroundColor }}
    >
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onMoveEnd={(_event, nextViewport) => setViewport(nextViewport)}
        onPaneClick={onCanvasPointerDown}
        onNodeClick={handleNodeClick}
        onPaneContextMenu={blockContextMenu}
        onNodeContextMenu={blockContextMenu}
        onDragOver={handleChatImageDragOver}
        onDrop={handleChatImageDrop}
        defaultViewport={viewport}
        minZoom={0.08}
        maxZoom={4}
        nodesConnectable={false}
        selectionOnDrag={!isMoveMode}
        selectionKeyCode={null}
        panOnDrag={isMoveMode ? true : [1, 2]}
        panActivationKeyCode={isMoveMode ? null : "Space"}
        panOnScroll
        onlyRenderVisibleElements
        multiSelectionKeyCode={["Meta", "Control", "Shift"]}
        nodesDraggable={!isMoveMode}
        elementsSelectable
        deleteKeyCode={null}
        elevateNodesOnSelect
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

      {showEmptyHint ? (
        <CanvasViewportEmptyHint locale={locale} onBackToContent={handleFitView} />
      ) : null}

      <div className="absolute bottom-4 left-4 z-20 flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title="撤销 (⌘Z)"
          className="border-r border-zinc-100 p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          title="重做 (⇧⌘Z)"
          className="p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
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
  onNodeClick,
  onGenerationTerminalFailure
}: {
  projectId: string;
  locale: Locale;
  onCanvasPointerDown?: () => void;
  onNodeClick?: (node: VincisCanvasNode) => void;
  onGenerationTerminalFailure?: (event: GenerationJobEvent) => void;
}) {
  return (
    <ReactFlowProvider>
      <InfiniteCanvasFlow
        key={projectId}
        projectId={projectId}
        locale={locale}
        onCanvasPointerDown={onCanvasPointerDown}
        onNodeClick={onNodeClick}
        onGenerationTerminalFailure={onGenerationTerminalFailure}
      />
    </ReactFlowProvider>
  );
}
