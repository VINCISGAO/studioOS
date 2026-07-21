"use client";

import { useEffect } from "react";
import { useCanvasStore } from "@/components/canvas/canvas-store";

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function isInsideCanvasChat(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("[data-canvas-chat-root]"));
}

function hasExternalTextSelection(target: EventTarget | null) {
  const selection = window.getSelection()?.toString().trim();
  if (!selection) return false;
  return !(target instanceof HTMLElement && target.closest(".canvas-flow"));
}

function shouldIgnoreCanvasShortcuts(event: KeyboardEvent) {
  if (isTypingTarget(event.target)) return true;
  if (isInsideCanvasChat(event.target)) return true;
  if (isInsideCanvasChat(document.activeElement)) return true;

  const command = event.metaKey || event.ctrlKey;
  if (command && event.key.toLowerCase() === "c" && hasExternalTextSelection(event.target)) {
    return true;
  }

  return false;
}

type ViewportShortcutHandlers = {
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
  zoom100: () => void;
  pasteAtCenter: () => void;
};

export function useCanvasShortcuts(handlers?: ViewportShortcutHandlers) {
  const duplicateSelected = useCanvasStore((state) => state.duplicateSelected);
  const deleteSelected = useCanvasStore((state) => state.deleteSelected);
  const copySelected = useCanvasStore((state) => state.copySelected);
  const cutSelected = useCanvasStore((state) => state.cutSelected);
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
  const setInteractionMode = useCanvasStore((state) => state.setInteractionMode);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreCanvasShortcuts(event)) return;
      const command = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (!command && !event.altKey && key === "v") {
        event.preventDefault();
        setInteractionMode("select");
        return;
      }
      if (!command && !event.altKey && key === "h") {
        event.preventDefault();
        setInteractionMode("move");
        return;
      }

      if (command && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (command && key === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (command && key === "c") {
        event.preventDefault();
        copySelected();
        return;
      }
      if (command && key === "x") {
        event.preventDefault();
        cutSelected();
        return;
      }
      if (command && key === "v") {
        event.preventDefault();
        handlers?.pasteAtCenter();
        return;
      }
      if (command && key === "d") {
        event.preventDefault();
        duplicateSelected();
        return;
      }
      if (command && !event.shiftKey && key === "g") {
        event.preventDefault();
        groupSelectedInFrame();
        return;
      }
      if (command && event.shiftKey && key === "g") {
        event.preventDefault();
        ungroupSelected();
        return;
      }
      if (command && key === "e") {
        event.preventDefault();
        mergeSelectedLayers();
        return;
      }
      if (command && event.shiftKey && key === "h") {
        event.preventDefault();
        toggleSelectedHidden();
        return;
      }
      if (command && event.shiftKey && key === "l") {
        event.preventDefault();
        toggleSelectedLocked();
        return;
      }
      if (command && key === "]") {
        event.preventDefault();
        bringForward();
        return;
      }
      if (command && key === "[") {
        event.preventDefault();
        sendBackward();
        return;
      }
      if (!command && key === "]") {
        event.preventDefault();
        bringToFront();
        return;
      }
      if (!command && key === "[") {
        event.preventDefault();
        sendToBack();
        return;
      }
      if (event.shiftKey && key === "a" && !command) {
        event.preventDefault();
        autoLayoutSelected();
        return;
      }
      if (command && (key === "=" || key === "+")) {
        event.preventDefault();
        handlers?.zoomIn();
        return;
      }
      if (command && key === "-") {
        event.preventDefault();
        handlers?.zoomOut();
        return;
      }
      if (command && key === "0") {
        event.preventDefault();
        handlers?.zoom100();
        return;
      }
      if (event.shiftKey && key === "1" && !command) {
        event.preventDefault();
        handlers?.fitView();
        return;
      }
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    autoLayoutSelected,
    bringForward,
    bringToFront,
    copySelected,
    cutSelected,
    deleteSelected,
    duplicateSelected,
    groupSelectedInFrame,
    handlers,
    mergeSelectedLayers,
    redo,
    sendBackward,
    sendToBack,
    setInteractionMode,
    toggleSelectedHidden,
    toggleSelectedLocked,
    undo,
    ungroupSelected
  ]);
}
