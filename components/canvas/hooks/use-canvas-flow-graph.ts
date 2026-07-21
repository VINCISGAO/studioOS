"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  useEdgesState,
  useNodesState,
  type EdgeChange,
  type NodeChange
} from "@xyflow/react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import type { VincisCanvasEdge, VincisCanvasNode } from "@/lib/canvas/types";

export function useCanvasFlowGraph(projectId: string) {
  const storeNodes = useCanvasStore((state) => state.nodes);
  const storeEdges = useCanvasStore((state) => state.edges);
  const storeRevision = useCanvasStore((state) => state.revision);
  const storeOnNodesChange = useCanvasStore((state) => state.onNodesChange);
  const storeOnEdgesChange = useCanvasStore((state) => state.onEdgesChange);

  const [nodes, setNodes, onNodesChangeLocal] = useNodesState<VincisCanvasNode>(storeNodes);
  const [edges, setEdges, onEdgesChangeLocal] = useEdgesState<VincisCanvasEdge>(storeEdges);
  const syncedRevision = useRef(storeRevision);
  const syncedProjectId = useRef(projectId);

  useEffect(() => {
    const state = useCanvasStore.getState();
    const projectChanged = syncedProjectId.current !== projectId;
    const revisionChanged = syncedRevision.current !== storeRevision;

    if (!projectChanged && !revisionChanged) return;

    syncedProjectId.current = projectId;
    syncedRevision.current = storeRevision;
    setNodes(state.nodes);
    setEdges(state.edges);
  }, [projectId, setEdges, setNodes, storeRevision]);

  const onNodesChange = useCallback(
    (changes: NodeChange<VincisCanvasNode>[]) => {
      onNodesChangeLocal(changes);
      storeOnNodesChange(changes);
    },
    [onNodesChangeLocal, storeOnNodesChange]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<VincisCanvasEdge>[]) => {
      onEdgesChangeLocal(changes);
      storeOnEdgesChange(changes);
    },
    [onEdgesChangeLocal, storeOnEdgesChange]
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange
  };
}
