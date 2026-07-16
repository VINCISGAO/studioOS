"use client";

import { useEffect } from "react";

type ScrollLockTarget = "body" | "html" | "both";

type LockSnapshot = {
  bodyOverflow: string;
  bodyOverscroll: string;
  bodyPosition: string;
  bodyTop: string;
  bodyWidth: string;
  bodyPaddingRight: string;
  htmlOverflow: string;
  htmlOverscroll: string;
  scrollY: number;
};

let lockCount = 0;
let snapshot: LockSnapshot | null = null;

function scrollbarWidth() {
  if (typeof window === "undefined") return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

function applyLock(target: ScrollLockTarget) {
  if (lockCount === 0) {
    const scrollY = window.scrollY;
    snapshot = {
      bodyOverflow: document.body.style.overflow,
      bodyOverscroll: document.body.style.overscrollBehavior,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width,
      bodyPaddingRight: document.body.style.paddingRight,
      htmlOverflow: document.documentElement.style.overflow,
      htmlOverscroll: document.documentElement.style.overscrollBehavior,
      scrollY
    };

    const gap = scrollbarWidth();
    if (gap > 0) {
      document.body.style.paddingRight = `${gap}px`;
    }

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
  }

  lockCount += 1;

  if (target === "html" || target === "both") {
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
  }
}

function releaseLock(target: ScrollLockTarget) {
  if (lockCount <= 0) return;
  lockCount -= 1;
  if (lockCount > 0) return;

  const saved = snapshot;
  snapshot = null;
  if (!saved) return;

  document.body.style.overflow = saved.bodyOverflow;
  document.body.style.overscrollBehavior = saved.bodyOverscroll;
  document.body.style.position = saved.bodyPosition;
  document.body.style.top = saved.bodyTop;
  document.body.style.width = saved.bodyWidth;
  document.body.style.paddingRight = saved.bodyPaddingRight;

  if (target === "html" || target === "both") {
    document.documentElement.style.overflow = saved.htmlOverflow;
    document.documentElement.style.overscrollBehavior = saved.htmlOverscroll;
  }

  window.scrollTo(0, saved.scrollY);
}

/** Ref-counted scroll lock — iOS-safe (position:fixed body) for portal + login shells. */
export function useBodyScrollLock(enabled: boolean, target: ScrollLockTarget = "both") {
  useEffect(() => {
    if (!enabled) return;
    applyLock(target);
    return () => releaseLock(target);
  }, [enabled, target]);
}
