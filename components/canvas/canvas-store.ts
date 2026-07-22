"use client";

import {
  applyNodeChanges,
  type NodeChange,
  type Viewport
} from "@xyflow/react";
import { create } from "zustand";
import type {
  CanvasNodeData,
  CanvasSnapshot,
  GenerationJobEvent,
  VincisCanvasEdge,
  VincisCanvasNode
} from "@/lib/canvas/types";
import { autoLayoutCanvas } from "@/lib/canvas/layout";
import {
  alignSelectedNodes,
  applyGenerationJobEvent,
  autoLayoutSelectedNodes,
  cutSelectedNodes,
  deleteSelectedNodes,
  duplicateSelectedNodes,
  groupSelectedInFrame,
  mergeSelectedMediaNodes,
  pasteNodesAt,
  reorderSelectedZIndex,
  sortSelectedNodes,
  toggleSelectedNodeFlag,
  ungroupSelectedNodes
} from "@/lib/canvas/canvas-node-mutations";
import { sanitizeLoadedCanvasNodes } from "@/lib/canvas/canvas-node-sanitize";
import { dedupeUneditedGenerationSlots } from "@/lib/canvas/generation-slot-dedupe";
import {
  shouldRecordNodeHistory,
  snapshotCanvasGraph,
  type CanvasHistoryEntry
} from "@/lib/canvas/canvas-history";
import {
  applyCanvasNodeInteractionFlags,
  applyCanvasNodeInteractionFlagsAll,
  deselectAllCanvasNodes
} from "@/lib/canvas/node-interaction";
import { DEFAULT_CANVAS_BACKGROUND, normalizeHexColor } from "@/lib/canvas/color";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type HistoryEntry = CanvasHistoryEntry;
export type CanvasInteractionMode = "select" | "move";

type CanvasStore = {
  projectId: string;
  canvasId: string;
  projectTitle: string;
  mode: "STANDALONE" | "ORDER";
  campaignId: string | null;
  nodes: VincisCanvasNode[];
  edges: VincisCanvasEdge[];
  viewport: Viewport;
  canvasBackgroundColor: string;
  selectedNodeIds: string[];
  interactionMode: CanvasInteractionMode;
  clipboardNodes: VincisCanvasNode[];
  revision: number;
  saveState: SaveState;
  past: HistoryEntry[];
  future: HistoryEntry[];
  initialize: (snapshot: CanvasSnapshot) => void;
  onNodesChange: (changes: NodeChange<VincisCanvasNode>[]) => void;
  setViewport: (viewport: Viewport, options?: { persist?: boolean }) => void;
  setCanvasBackgroundColor: (color: string) => void;
  setInteractionMode: (mode: CanvasInteractionMode) => void;
  addNode: (node: VincisCanvasNode) => void;
  addNodes: (nodes: VincisCanvasNode[], selectNodeId?: string) => void;
  updateNodeData: (nodeId: string, data: Partial<CanvasNodeData>) => void;
  patchNodeData: (nodeId: string, data: Partial<CanvasNodeData>) => void;
  setNodeTypeAndData: (
    nodeId: string,
    type: VincisCanvasNode["type"],
    data: Partial<CanvasNodeData>
  ) => void;
  applyJobEvent: (event: GenerationJobEvent) => void;
  deleteSelected: () => void;
  copySelected: () => void;
  cutSelected: () => void;
  pasteAt: (position: { x: number; y: number }) => void;
  duplicateSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  ungroupSelected: () => void;
  mergeSelectedLayers: () => void;
  autoLayoutSelected: () => void;
  toggleSelectedHidden: () => void;
  toggleSelectedLocked: () => void;
  autoLayout: () => void;
  alignSelected: () => void;
  sortSelected: () => void;
  groupSelectedInFrame: () => void;
  undo: () => void;
  redo: () => void;
  setSaveState: (state: SaveState) => void;
};

const emptyViewport = { x: 0, y: 0, zoom: 1 };

function recordHistory(state: CanvasStore) {
  return {
    past: [...state.past.slice(-29), snapshotCanvasGraph(state.nodes, state.edges)],
    future: []
  };
}

function withDirtyHistory<T extends Record<string, unknown>>(state: CanvasStore, patch: T) {
  return {
    ...patch,
    revision: state.revision + 1,
    saveState: "dirty" as const,
    ...recordHistory(state)
  };
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  projectId: "",
  canvasId: "",
  projectTitle: "",
  mode: "STANDALONE",
  campaignId: null,
  nodes: [],
  edges: [],
  viewport: emptyViewport,
  canvasBackgroundColor: DEFAULT_CANVAS_BACKGROUND,
  selectedNodeIds: [],
  interactionMode: "select",
  clipboardNodes: [],
  revision: 0,
  saveState: "idle",
  past: [],
  future: [],

  initialize(snapshot) {
    set({
      projectId: snapshot.projectId,
      canvasId: snapshot.canvasId,
      projectTitle: snapshot.title,
      mode: snapshot.mode,
      campaignId: snapshot.campaignId,
      nodes: sanitizeLoadedCanvasNodes(snapshot.nodes),
      edges: [],
      viewport: snapshot.viewport,
      canvasBackgroundColor: snapshot.canvasBackgroundColor,
      selectedNodeIds: [],
      revision: 0,
      saveState: "idle",
      past: [],
      future: [],
      interactionMode: "select",
      clipboardNodes: []
    });
  },

  onNodesChange(changes) {
    set((state) => {
      const nodes = applyNodeChanges(changes, state.nodes);
      const dirty = changes.some((change) => change.type !== "select");
      const record = shouldRecordNodeHistory(changes);
      const selectOnly = changes.every((change) => change.type === "select");
      const nextNodes = selectOnly ? nodes : applyCanvasNodeInteractionFlagsAll(nodes);
      return {
        nodes: nextNodes,
        selectedNodeIds: nextNodes.filter((node) => node.selected).map((node) => node.id),
        revision: dirty ? state.revision + 1 : state.revision,
        saveState: dirty ? "dirty" : state.saveState,
        ...(record ? recordHistory(state) : {})
      };
    });
  },

  setViewport(viewport, options) {
    const previous = get().viewport;
    if (
      previous.x === viewport.x &&
      previous.y === viewport.y &&
      previous.zoom === viewport.zoom
    ) {
      return;
    }
    set((state) => ({
      viewport,
      revision: options?.persist ? state.revision + 1 : state.revision,
      saveState: options?.persist ? "dirty" : state.saveState
    }));
  },

  setCanvasBackgroundColor(color) {
    const normalized = normalizeHexColor(color);
    if (!normalized || get().canvasBackgroundColor === normalized) return;
    set((state) => ({
      canvasBackgroundColor: normalized,
      revision: state.revision + 1,
      saveState: "dirty"
    }));
  },

  setInteractionMode(mode) {
    if (get().interactionMode === mode) return;
    set({ interactionMode: mode });
  },

  addNode(node) {
    set((state) => {
      const merged = [
        ...deselectAllCanvasNodes(state.nodes),
        applyCanvasNodeInteractionFlags({ ...node, selected: true })
      ];
      const nodes = dedupeUneditedGenerationSlots(merged).map((item) =>
        item.id === node.id ? { ...item, selected: true } : item
      );
      return {
        nodes,
        selectedNodeIds: nodes.some((item) => item.id === node.id) ? [node.id] : [],
        revision: state.revision + 1,
        saveState: "dirty" as const,
        ...recordHistory(state)
      };
    });
  },

  addNodes(nodes, selectNodeId) {
    if (!nodes.length) return;
    const selectedId = selectNodeId ?? nodes[0]?.id;
    set((state) => ({
      nodes: [
        ...deselectAllCanvasNodes(state.nodes),
        ...nodes.map((node) =>
          applyCanvasNodeInteractionFlags({ ...node, selected: node.id === selectedId })
        )
      ],
      selectedNodeIds: selectedId ? [selectedId] : [],
      revision: state.revision + 1,
      saveState: "dirty",
      ...recordHistory(state)
    }));
  },

  updateNodeData(nodeId, data) {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
      revision: state.revision + 1,
      saveState: "dirty",
      ...recordHistory(state)
    }));
  },

  patchNodeData(nodeId, data) {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
      revision: state.revision + 1,
      saveState: "dirty"
    }));
  },

  setNodeTypeAndData(nodeId, type, data) {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, type, data: { ...node.data, ...data } }
          : node
      ),
      revision: state.revision + 1,
      saveState: "dirty",
      ...recordHistory(state)
    }));
  },

  applyJobEvent(event) {
    set((state) => {
      const next = applyGenerationJobEvent(state.nodes, event);
      if (!next) return state;
      return {
        nodes: next.nodes,
        revision: next.terminal ? state.revision + 1 : state.revision,
        saveState: next.terminal ? "dirty" : state.saveState,
        ...(next.terminal ? recordHistory(state) : {})
      };
    });
  },

  deleteSelected() {
    set((state) => {
      const selectedNodeIds = state.selectedNodeIds.length
        ? state.selectedNodeIds
        : state.nodes.filter((node) => node.selected).map((node) => node.id);
      if (!selectedNodeIds.length) return state;
      return withDirtyHistory(
        state,
        deleteSelectedNodes(state.nodes, state.edges, selectedNodeIds)
      );
    });
  },

  copySelected() {
    set((state) => {
      const selected = state.nodes.filter(
        (node) => state.selectedNodeIds.includes(node.id) || node.selected
      );
      if (!selected.length) return state;
      return {
        clipboardNodes: selected.map((node) => ({ ...node, selected: false }))
      };
    });
  },

  pasteAt(position) {
    set((state) => {
      const next = pasteNodesAt(
        state.nodes,
        state.selectedNodeIds,
        state.clipboardNodes,
        position
      );
      if (!next) return state;
      return withDirtyHistory(state, next);
    });
  },

  cutSelected() {
    set((state) => {
      const next = cutSelectedNodes(state.nodes, state.edges, state.selectedNodeIds);
      if (!next) return state;
      return withDirtyHistory(state, {
        nodes: applyCanvasNodeInteractionFlagsAll(next.nodes),
        edges: next.edges,
        selectedNodeIds: next.selectedNodeIds,
        clipboardNodes: next.clipboardNodes
      });
    });
  },

  bringForward() {
    set((state) =>
      withDirtyHistory(state, {
        nodes: reorderSelectedZIndex(state.nodes, state.selectedNodeIds, "forward")
      })
    );
  },

  sendBackward() {
    set((state) =>
      withDirtyHistory(state, {
        nodes: reorderSelectedZIndex(state.nodes, state.selectedNodeIds, "backward")
      })
    );
  },

  bringToFront() {
    set((state) =>
      withDirtyHistory(state, {
        nodes: reorderSelectedZIndex(state.nodes, state.selectedNodeIds, "front")
      })
    );
  },

  sendToBack() {
    set((state) =>
      withDirtyHistory(state, {
        nodes: reorderSelectedZIndex(state.nodes, state.selectedNodeIds, "back")
      })
    );
  },

  ungroupSelected() {
    set((state) =>
      withDirtyHistory(state, {
        nodes: ungroupSelectedNodes(state.nodes, state.selectedNodeIds)
      })
    );
  },

  mergeSelectedLayers() {
    set((state) => {
      const next = mergeSelectedMediaNodes(state.nodes, state.selectedNodeIds);
      if (!next) return state;
      return withDirtyHistory(state, {
        nodes: next.nodes,
        selectedNodeIds: next.selectedNodeIds
      });
    });
  },

  autoLayoutSelected() {
    set((state) =>
      withDirtyHistory(state, {
        nodes: autoLayoutSelectedNodes(state.nodes, state.edges, state.selectedNodeIds)
      })
    );
  },

  toggleSelectedHidden() {
    set((state) =>
      withDirtyHistory(state, {
        nodes: toggleSelectedNodeFlag(state.nodes, state.selectedNodeIds, "hidden")
      })
    );
  },

  toggleSelectedLocked() {
    set((state) =>
      withDirtyHistory(state, {
        nodes: toggleSelectedNodeFlag(state.nodes, state.selectedNodeIds, "locked")
      })
    );
  },

  duplicateSelected() {
    set((state) => {
      const next = duplicateSelectedNodes(state.nodes, state.selectedNodeIds);
      if (!next) return state;
      return withDirtyHistory(state, next);
    });
  },

  autoLayout() {
    set((state) => ({
      nodes: autoLayoutCanvas(state.nodes, state.edges),
      revision: state.revision + 1,
      saveState: "dirty",
      ...recordHistory(state)
    }));
  },

  alignSelected() {
    set((state) => {
      const nodes = alignSelectedNodes(state.nodes, state.selectedNodeIds);
      if (!nodes) return state;
      return { nodes, revision: state.revision + 1, saveState: "dirty", ...recordHistory(state) };
    });
  },

  sortSelected() {
    set((state) => {
      const nodes = sortSelectedNodes(state.nodes, state.selectedNodeIds);
      if (!nodes) return state;
      return { nodes, revision: state.revision + 1, saveState: "dirty", ...recordHistory(state) };
    });
  },

  groupSelectedInFrame() {
    set((state) => {
      const next = groupSelectedInFrame(state.nodes, state.selectedNodeIds);
      if (!next) return state;
      return {
        nodes: next.nodes,
        selectedNodeIds: next.selectedNodeIds,
        revision: state.revision + 1,
        saveState: "dirty",
        ...recordHistory(state)
      };
    });
  },

  undo() {
    set((state) => {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      const nodes = applyCanvasNodeInteractionFlagsAll(
        previous.nodes.map((node) => ({ ...node, selected: false }))
      );
      return {
        nodes,
        edges: [],
        selectedNodeIds: [],
        past: state.past.slice(0, -1),
        future: [snapshotCanvasGraph(state.nodes, state.edges), ...state.future].slice(0, 30),
        revision: state.revision + 1,
        saveState: "dirty"
      };
    });
  },

  redo() {
    set((state) => {
      const next = state.future[0];
      if (!next) return state;
      const nodes = applyCanvasNodeInteractionFlagsAll(
        next.nodes.map((node) => ({ ...node, selected: false }))
      );
      return {
        nodes,
        edges: [],
        selectedNodeIds: [],
        past: [...state.past, snapshotCanvasGraph(state.nodes, state.edges)].slice(-30),
        future: state.future.slice(1),
        revision: state.revision + 1,
        saveState: "dirty"
      };
    });
  },

  setSaveState(saveState) {
    set({ saveState });
  }
}));
