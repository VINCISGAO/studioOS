"use client";

import { useEffect } from "react";

type ScrollLockTarget = "body" | "html" | "both";

let lockCount = 0;
let savedBodyOverflow = "";
let savedBodyOverscroll = "";
let savedHtmlOverflow = "";

function applyLock(target: ScrollLockTarget) {
  if (lockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    savedBodyOverscroll = document.body.style.overscrollBehavior;
    savedHtmlOverflow = document.documentElement.style.overflow;
  }
  lockCount += 1;

  if (target === "body" || target === "both") {
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
  }
  if (target === "html" || target === "both") {
    document.documentElement.style.overflow = "hidden";
  }
}

function releaseLock(target: ScrollLockTarget) {
  if (lockCount <= 0) return;
  lockCount -= 1;
  if (lockCount > 0) return;

  document.body.style.overflow = savedBodyOverflow;
  document.body.style.overscrollBehavior = savedBodyOverscroll;
  document.documentElement.style.overflow = savedHtmlOverflow;
}

/** Ref-counted scroll lock — safe when portal + modal + drawer stack. */
export function useBodyScrollLock(enabled: boolean, target: ScrollLockTarget = "both") {
  useEffect(() => {
    if (!enabled) return;
    applyLock(target);
    return () => releaseLock(target);
  }, [enabled, target]);
}
