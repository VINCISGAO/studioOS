"use client";

import { useEffect, useRef } from "react";

function shouldIgnoreSpaceShortcut(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  if (target.closest("[contenteditable='true'], [role='textbox']")) return true;
  if (target.closest("dialog[open], [role='dialog']")) return true;
  if (target.closest("button, a, [role='button'], [role='link']")) return true;
  return false;
}

export function useReviewerPlaybackKeyboard(onPlayPause: () => void, enabled: boolean) {
  const onPlayPauseRef = useRef(onPlayPause);

  useEffect(() => {
    onPlayPauseRef.current = onPlayPause;
  }, [onPlayPause]);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" && event.key !== " ") return;
      if (event.repeat) return;
      if (shouldIgnoreSpaceShortcut(event.target)) return;

      event.preventDefault();
      onPlayPauseRef.current();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
