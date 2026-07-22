"use client";

import { createContext, useContext, type ReactNode } from "react";

type CanvasNodeActions = {
  regenerate: (nodeId: string) => void;
  extendVideo: (nodeId: string) => void;
  upscale: (nodeId: string) => void;
  removeBackground: (nodeId: string) => void;
};

const CanvasNodeActionsContext = createContext<CanvasNodeActions | null>(null);

export function CanvasNodeActionsProvider({
  value,
  children
}: {
  value: CanvasNodeActions;
  children: ReactNode;
}) {
  return (
    <CanvasNodeActionsContext.Provider value={value}>{children}</CanvasNodeActionsContext.Provider>
  );
}

export function useCanvasNodeActions() {
  return useContext(CanvasNodeActionsContext);
}
