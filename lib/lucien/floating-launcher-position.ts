export type FloatingLauncherPosition = {
  x: number;
  y: number;
};

export const FLOATING_LAUNCHER_STORAGE_KEY = "vincis-ai-copilot-launcher-position";
export const FLOATING_LAUNCHER_SIZE = 48;
export const FLOATING_LAUNCHER_EDGE_OFFSET = 20;
export const FLOATING_LAUNCHER_TOP_SAFE = 96;
export const FLOATING_LAUNCHER_BOTTOM_SAFE = 128;
export const FLOATING_LAUNCHER_CLICK_THRESHOLD = 10;

function clampLauncherY(y: number) {
  if (typeof window === "undefined") return y;
  const maxY = Math.max(
    FLOATING_LAUNCHER_TOP_SAFE,
    window.innerHeight - FLOATING_LAUNCHER_BOTTOM_SAFE - FLOATING_LAUNCHER_SIZE
  );
  return Math.min(Math.max(y, FLOATING_LAUNCHER_TOP_SAFE), maxY);
}

function clampLauncherX(x: number) {
  if (typeof window === "undefined") return x;
  const maxX = Math.max(
    FLOATING_LAUNCHER_EDGE_OFFSET,
    window.innerWidth - FLOATING_LAUNCHER_EDGE_OFFSET - FLOATING_LAUNCHER_SIZE
  );
  return Math.min(Math.max(x, FLOATING_LAUNCHER_EDGE_OFFSET), maxX);
}

export function defaultLauncherPosition(): FloatingLauncherPosition {
  if (typeof window === "undefined") {
    return { x: 320, y: 520 };
  }

  return normalizeLauncherPosition({
    x: window.innerWidth - FLOATING_LAUNCHER_EDGE_OFFSET - FLOATING_LAUNCHER_SIZE,
    y: window.innerHeight - FLOATING_LAUNCHER_BOTTOM_SAFE - FLOATING_LAUNCHER_SIZE
  });
}

export function normalizeLauncherPosition(position: FloatingLauncherPosition): FloatingLauncherPosition {
  return {
    x: clampLauncherX(position.x),
    y: clampLauncherY(position.y)
  };
}

export function readStoredLauncherPosition(
  storageKey = FLOATING_LAUNCHER_STORAGE_KEY
): FloatingLauncherPosition {
  if (typeof window === "undefined") return defaultLauncherPosition();

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return defaultLauncherPosition();
    const parsed = JSON.parse(stored) as Partial<FloatingLauncherPosition> & {
      side?: "left" | "right";
      y?: number;
    };
    if (typeof parsed.x === "number" && typeof parsed.y === "number") {
      return normalizeLauncherPosition({ x: parsed.x, y: parsed.y });
    }
    if ((parsed.side === "left" || parsed.side === "right") && typeof parsed.y === "number") {
      const x =
        parsed.side === "left"
          ? FLOATING_LAUNCHER_EDGE_OFFSET
          : window.innerWidth - FLOATING_LAUNCHER_EDGE_OFFSET - FLOATING_LAUNCHER_SIZE;
      return normalizeLauncherPosition({ x, y: parsed.y });
    }
  } catch {
    return defaultLauncherPosition();
  }

  return defaultLauncherPosition();
}

export function storeLauncherPosition(
  position: FloatingLauncherPosition,
  storageKey = FLOATING_LAUNCHER_STORAGE_KEY
) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(position));
  } catch {
    // Position memory is a convenience only.
  }
}
