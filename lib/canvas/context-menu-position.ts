const VIEWPORT_PADDING = 12;

export function clampContextMenuPosition(
  x: number,
  y: number,
  size: { width: number; height: number }
) {
  if (typeof window === "undefined") {
    return { left: x, top: y };
  }

  const maxLeft = window.innerWidth - VIEWPORT_PADDING - size.width;
  const maxTop = window.innerHeight - VIEWPORT_PADDING - size.height;

  return {
    left: Math.min(Math.max(VIEWPORT_PADDING, x), Math.max(VIEWPORT_PADDING, maxLeft)),
    top: Math.min(Math.max(VIEWPORT_PADDING, y), Math.max(VIEWPORT_PADDING, maxTop))
  };
}

export const CONTEXT_MENU_MAX_HEIGHT = "calc(100dvh - 24px)";
