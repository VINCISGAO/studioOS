"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Maximize2, Minimize2 } from "lucide-react";
import { CanvasChatPanel } from "@/components/canvas/canvas-chat-panel";
import { CanvasCreditsHud } from "@/components/canvas/canvas-credits-hud";
import { CanvasNodeActionsProvider } from "@/components/canvas/canvas-node-actions-context";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import {
  GenerationPanel,
  type GenerationKind
} from "@/components/canvas/generation-panel";
import { FloatingToolbar } from "@/components/canvas/floating-toolbar";
import { InfiniteCanvas } from "@/components/canvas/infinite-canvas";
import { JobStatusPanel } from "@/components/canvas/job-status-panel";
import { SelectionToolbar } from "@/components/canvas/selection-toolbar";
import { useCanvasGenerationSlots } from "@/components/canvas/hooks/use-canvas-generation-slots";
import { useCanvasMediaActions } from "@/components/canvas/hooks/use-canvas-media-actions";
import {
  normalizeCanvasTokenBalance
} from "@/lib/canvas/generation-credits";
import type { CanvasSnapshot, VincisCanvasNode } from "@/lib/canvas/types";
import type { Locale } from "@/lib/i18n";
import {
  buildChatImageCanvasNode,
  type ChatImageCanvasPayload
} from "@/lib/canvas/chat-image-canvas";
import { CANVAS_SEND_TO_CHAT_EVENT } from "@/lib/canvas/canvas-chat-bridge";
import { readViewportRect, viewportCenterFlowPoint } from "@/lib/canvas/viewport-anchor";

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
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(() =>
    normalizeCanvasTokenBalance(snapshot.projectContext.tokenBalance)
  );
  const initializedProjectId = useRef<string | null>(null);
  const fullscreenAreaRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const pasteAt = useCanvasStore((state) => state.pasteAt);
  const viewport = useCanvasStore((state) => state.viewport);
  const { generate, regenerate, extendVideo, upscale, removeBackground, generationPending } =
    useCanvasMediaActions(
    snapshot.projectId,
    {
      onCreditsCharged: (amount) => {
        const charge =
          typeof amount === "number" && Number.isFinite(amount) && amount > 0
            ? Math.round(amount)
            : 0;
        if (!charge) return;
        setTokenBalance((current) => Math.max(0, Math.round(current - charge)));
      }
    }
  );
  const nodeActions = useMemo(
    () => ({ regenerate, extendVideo, upscale, removeBackground }),
    [extendVideo, regenerate, removeBackground, upscale]
  );
  const {
    panel,
    panelAnchor,
    generationSession,
    openGeneration,
    closeGenerationPanel,
    handleGenerationNodeClick
  } = useCanvasGenerationSlots({
    locale,
    canvasAreaRef,
    initialPanel,
    ready
  });

  useEffect(() => {
    if (initializedProjectId.current === snapshot.projectId) {
      setReady(true);
      return;
    }
    initializedProjectId.current = snapshot.projectId;
    useCanvasStore.getState().initialize(snapshot);
    useCanvasStore.getState().setInteractionMode("select");
    setTokenBalance(normalizeCanvasTokenBalance(snapshot.projectContext.tokenBalance));
    setReady(true);
  }, [snapshot]);

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
      if (key === "i") openGeneration("image");
      if (key === "s") openGeneration("video");
      if (key === "m") openGeneration("music");
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [openGeneration]);

  useEffect(() => {
    if (!panel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeGenerationPanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeGenerationPanel, panel]);

  useEffect(() => {
    const onChatImageAdd = (event: Event) => {
      const detail = (event as CustomEvent<ChatImageCanvasPayload>).detail;
      if (!detail?.assetId || !detail.url) return;
      const rect = readViewportRect(canvasAreaRef.current);
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

  useEffect(() => {
    setFullscreenSupported(document.fullscreenEnabled);
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === fullscreenAreaRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const fullscreenArea = fullscreenAreaRef.current;
    if (!fullscreenArea || !document.fullscreenEnabled) return;
    try {
      if (document.fullscreenElement === fullscreenArea) {
        await document.exitFullscreen();
      } else {
        await fullscreenArea.requestFullscreen();
      }
    } catch {
      setIsFullscreen(document.fullscreenElement === fullscreenArea);
    }
  }, []);

  const handleNodeClick = useCallback(
    (node: VincisCanvasNode) => {
      if (handleGenerationNodeClick(node)) return;
      closeGenerationPanel();
    },
    [closeGenerationPanel, handleGenerationNodeClick]
  );

  const pasteSelectionAtCenter = useCallback(() => {
    const rect = readViewportRect(canvasAreaRef.current);
    pasteAt(viewportCenterFlowPoint(viewport, rect));
  }, [pasteAt, viewport]);

  if (!ready) return <div className="h-full bg-[#f7f7f6]" />;

  return (
    <CanvasNodeActionsProvider value={nodeActions}>
      <div className="flex h-full min-h-0 flex-col bg-[#f7f7f6]">
        <div
          ref={fullscreenAreaRef}
          className="relative flex min-h-0 flex-1 overflow-hidden bg-[#f7f7f6]"
        >
          <div
            ref={canvasAreaRef}
            className="relative min-w-0 flex-1 overflow-hidden bg-[#f7f7f6]"
          >
            <InfiniteCanvas
              projectId={snapshot.projectId}
              locale={locale}
              onCanvasPointerDown={() => {
                if (panel) closeGenerationPanel();
              }}
              onNodeClick={handleNodeClick}
            />
            <button
              type="button"
              onClick={toggleFullscreen}
              disabled={!fullscreenSupported}
              aria-label={
                isFullscreen
                  ? locale === "zh"
                    ? "退出全屏"
                    : "Exit fullscreen"
                  : locale === "zh"
                    ? "全屏"
                    : "Fullscreen"
              }
              title={
                isFullscreen
                  ? locale === "zh"
                    ? "退出全屏"
                    : "Exit fullscreen"
                  : locale === "zh"
                    ? "全屏"
                    : "Fullscreen"
              }
              className="absolute left-3 top-3 z-40 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white/95 text-zinc-600 shadow-sm backdrop-blur transition hover:bg-white hover:text-zinc-950 disabled:hidden"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
            <CanvasCreditsHud
              locale={locale}
              tokenBalance={tokenBalance}
              reservedCredits={snapshot.projectContext.reservedCredits ?? 0}
            />
            <SelectionToolbar onPaste={pasteSelectionAtCenter} />
            <FloatingToolbar onGenerate={openGeneration} />
            <JobStatusPanel />
            {panel && panelAnchor ? (
              <GenerationPanel
                kind={panel}
                locale={locale}
                projectId={snapshot.projectId}
                busy={generationPending}
                anchor={panelAnchor}
                anchorPlacement={generationSession ? "below" : "above"}
                tokenBalance={tokenBalance}
                onClose={closeGenerationPanel}
                onSubmit={(input) => {
                  generate(input.kind, {
                    ...input,
                    targetNodeId:
                      generationSession?.kind === input.kind
                        ? generationSession.slotNodeId
                        : undefined
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
    </CanvasNodeActionsProvider>
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
