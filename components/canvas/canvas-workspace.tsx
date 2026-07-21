"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { OnSelectionChangeFunc } from "@xyflow/react";
import { CanvasChatPanel } from "@/components/canvas/canvas-chat-panel";
import { CanvasCreditsHud } from "@/components/canvas/canvas-credits-hud";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import {
  GenerationPanel,
  type GenerationKind
} from "@/components/canvas/generation-panel";
import { FloatingToolbar } from "@/components/canvas/floating-toolbar";
import { InfiniteCanvas } from "@/components/canvas/infinite-canvas";
import { JobStatusPanel } from "@/components/canvas/job-status-panel";
import { SelectionToolbar } from "@/components/canvas/selection-toolbar";
import { useCanvasMediaActions } from "@/components/canvas/hooks/use-canvas-media-actions";
import type { CanvasSnapshot, VincisCanvasNode } from "@/lib/canvas/types";
import type { Locale } from "@/lib/i18n";
import {
  countVideoGenerationLayouts,
  createVideoGenerationLayout,
  isUneditedVideoGenerationSlot
} from "@/lib/canvas/video-layout";
import {
  buildChatImageCanvasNode,
  type ChatImageCanvasPayload
} from "@/lib/canvas/chat-image-canvas";
import { CANVAS_SEND_TO_CHAT_EVENT } from "@/lib/canvas/canvas-chat-bridge";
import {
  defaultPanelAnchor,
  nextVideoLayoutPosition,
  panelAnchorBelowNode,
  viewportCenterFlowPoint,
  type ViewportRect
} from "@/lib/canvas/viewport-anchor";

type VideoGenerationSession = {
  slotNodeId: string;
};

function readCanvasRect(element: HTMLDivElement | null): ViewportRect {
  if (!element) {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  return { width: element.clientWidth, height: element.clientHeight };
}

function CanvasWorkspaceInner({
  snapshot,
  locale,
  initialPanel = null
}: {
  snapshot: CanvasSnapshot;
  locale: Locale;
  initialPanel?: GenerationKind | null;
}) {
  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState<GenerationKind | null>(initialPanel);
  const [panelAnchor, setPanelAnchor] = useState<{ x: number; y: number } | null>(null);
  const [videoSession, setVideoSession] = useState<VideoGenerationSession | null>(null);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const initialVideoLayoutCreated = useRef(false);
  const initializedProjectId = useRef<string | null>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const addNode = useCanvasStore((state) => state.addNode);
  const nodes = useCanvasStore((state) => state.nodes);
  const pasteAt = useCanvasStore((state) => state.pasteAt);
  const viewport = useCanvasStore((state) => state.viewport);
  const { generate, regenerate, generationPending } = useCanvasMediaActions(
    snapshot.projectId
  );

  useEffect(() => {
    if (initializedProjectId.current === snapshot.projectId) {
      setReady(true);
      return;
    }
    initializedProjectId.current = snapshot.projectId;
    initialVideoLayoutCreated.current = false;
    useCanvasStore.getState().initialize(snapshot);
    useCanvasStore.getState().setInteractionMode("select");
    setReady(true);
  }, [snapshot]);

  useEffect(() => {
    if (!ready) return;
    useCanvasStore.getState().setInteractionMode("select");
  }, [ready]);

  const openVideoGenerationSlot = useCallback((node: VincisCanvasNode) => {
    const rect = readCanvasRect(canvasAreaRef.current);
    const state = useCanvasStore.getState();
    setVideoSession({ slotNodeId: node.id });
    setPanelAnchor(panelAnchorBelowNode(node, state.viewport, rect));
    setPanel("video");
  }, []);

  const openVideoGeneration = useCallback(() => {
    const state = useCanvasStore.getState();
    const existingSlot = state.nodes.find(isUneditedVideoGenerationSlot);
    if (existingSlot) {
      openVideoGenerationSlot(existingSlot);
      return;
    }
    const rect = readCanvasRect(canvasAreaRef.current);
    const layoutIndex = countVideoGenerationLayouts(state.nodes);
    const position = nextVideoLayoutPosition(state.viewport, rect, layoutIndex);
    const layout = createVideoGenerationLayout({
      layoutIndex,
      position,
      locale
    });
    addNode(layout.node);
    setVideoSession({ slotNodeId: layout.slotNodeId });
    setPanelAnchor(panelAnchorBelowNode(layout.node, state.viewport, rect));
    setPanel("video");
  }, [addNode, locale, openVideoGenerationSlot]);

  useEffect(() => {
    if (!panel || panel !== "video" || !videoSession) return;
    const node = nodes.find((item) => item.id === videoSession.slotNodeId);
    if (!node) return;
    setPanelAnchor(panelAnchorBelowNode(node, viewport, readCanvasRect(canvasAreaRef.current)));
  }, [panel, videoSession, nodes, viewport]);

  useEffect(() => {
    if (!ready || initialPanel !== "video" || initialVideoLayoutCreated.current) return;
    initialVideoLayoutCreated.current = true;
    openVideoGeneration();
  }, [ready, initialPanel, openVideoGeneration]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "i") {
        setVideoSession(null);
        setPanelAnchor(defaultPanelAnchor(readCanvasRect(canvasAreaRef.current)));
        setPanel("image");
      }
      if (key === "s") openVideoGeneration();
      if (key === "m") {
        setVideoSession(null);
        setPanelAnchor(defaultPanelAnchor(readCanvasRect(canvasAreaRef.current)));
        setPanel("music");
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [openVideoGeneration]);

  function openGenerationPanel(kind: GenerationKind) {
    if (kind === "video") {
      openVideoGeneration();
      return;
    }
    setVideoSession(null);
    setPanelAnchor(defaultPanelAnchor(readCanvasRect(canvasAreaRef.current)));
    setPanel(kind);
  }

  function closeGenerationPanel() {
    setPanel(null);
    setPanelAnchor(null);
    setVideoSession(null);
  }

  useEffect(() => {
    if (!panel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeGenerationPanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panel]);

  useEffect(() => {
    const onNodeAction = (event: Event) => {
      const detail = (event as CustomEvent<{ action: string; nodeId: string }>).detail;
      if (!detail?.nodeId) return;
      if (detail.action === "extend-video") {
        const node = useCanvasStore.getState().nodes.find((item) => item.id === detail.nodeId);
        if (node?.data.prompt) generate("video", { prompt: `Extend: ${node.data.prompt}` });
      }
      if (detail.action === "regenerate") regenerate(detail.nodeId);
    };
    window.addEventListener("canvas:node-action", onNodeAction);
    return () => window.removeEventListener("canvas:node-action", onNodeAction);
  }, [generate, regenerate]);

  useEffect(() => {
    const onChatImageAdd = (event: Event) => {
      const detail = (event as CustomEvent<ChatImageCanvasPayload>).detail;
      if (!detail?.assetId || !detail.url) return;
      const rect = readCanvasRect(canvasAreaRef.current);
      const center = viewportCenterFlowPoint(useCanvasStore.getState().viewport, rect);
      useCanvasStore.getState().addNode(buildChatImageCanvasNode(detail, center));
    };
    window.addEventListener("canvas:chat-image-add", onChatImageAdd);
    return () => window.removeEventListener("canvas:chat-image-add", onChatImageAdd);
  }, []);

  useEffect(() => {
    const onSendToChat = () => setChatCollapsed(false);
    window.addEventListener(CANVAS_SEND_TO_CHAT_EVENT, onSendToChat);
    return () => window.removeEventListener(CANVAS_SEND_TO_CHAT_EVENT, onSendToChat);
  }, []);

  const handleSelectionChange = useCallback<OnSelectionChangeFunc<VincisCanvasNode>>(
    ({ nodes: selectedNodes }) => {
      if (selectedNodes.length !== 1) return;
      const node = selectedNodes[0];
      if (isUneditedVideoGenerationSlot(node)) {
        openVideoGenerationSlot(node);
        return;
      }
      if (panel) closeGenerationPanel();
    },
    [openVideoGenerationSlot, panel]
  );

  const pasteSelectionAtCenter = useCallback(() => {
    const rect = readCanvasRect(canvasAreaRef.current);
    pasteAt(viewportCenterFlowPoint(viewport, rect));
  }, [pasteAt, viewport]);

  if (!ready) return <div className="h-full bg-[#f7f7f6]" />;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f7f7f6]">
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div ref={canvasAreaRef} className="relative min-w-0 flex-1 overflow-hidden">
          <InfiniteCanvas
            projectId={snapshot.projectId}
            locale={locale}
            onCanvasPointerDown={() => {
              if (panel) closeGenerationPanel();
            }}
            onSelectionChange={handleSelectionChange}
          />
          <CanvasCreditsHud
            locale={locale}
            tokenBalance={snapshot.projectContext.tokenBalance}
          />
          <SelectionToolbar
            onPaste={pasteSelectionAtCenter}
            onRegenerate={regenerate}
            onImageToVideo={(nodeId) => {
              const node = useCanvasStore.getState().nodes.find((item) => item.id === nodeId);
              if (node?.data.prompt) generate("video", { prompt: `Animate: ${node.data.prompt}` });
            }}
            onExtendVideo={(nodeId) => {
              const node = useCanvasStore.getState().nodes.find((item) => item.id === nodeId);
              if (node?.data.prompt) generate("video", { prompt: `Extend: ${node.data.prompt}` });
            }}
          />
          <FloatingToolbar onGenerate={openGenerationPanel} />
          <JobStatusPanel />
          {panel && panelAnchor ? (
            <GenerationPanel
              kind={panel}
              locale={locale}
              projectId={snapshot.projectId}
              busy={generationPending}
              anchor={panelAnchor}
              anchorPlacement={videoSession ? "below" : "above"}
              onClose={closeGenerationPanel}
              onSubmit={(input) => {
                generate(input.kind, {
                  ...input,
                  targetNodeId: input.kind === "video" ? videoSession?.slotNodeId : undefined
                });
                closeGenerationPanel();
              }}
            />
          ) : null}
        </div>
        <CanvasChatPanel
          locale={locale}
          projectId={snapshot.projectId}
          collapsed={chatCollapsed}
          onToggle={() => setChatCollapsed((value) => !value)}
        />
      </div>
    </div>
  );
}

export function CanvasWorkspace({
  snapshot,
  locale,
  initialPanel = null
}: {
  snapshot: CanvasSnapshot;
  locale: Locale;
  initialPanel?: GenerationKind | null;
}) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <CanvasWorkspaceInner
        snapshot={snapshot}
        locale={locale}
        initialPanel={initialPanel}
      />
    </QueryClientProvider>
  );
}
