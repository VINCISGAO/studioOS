/** Build evenly spaced tick positions (seconds) for a video timeline axis. */
export function buildTimelineTicks(durationSec: number): number[] {
  if (durationSec <= 0) return [0];

  const targetCount = 6;
  const rawInterval = durationSec / Math.max(targetCount - 1, 1);
  const niceSteps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800];
  const interval = niceSteps.find((step) => step >= rawInterval) ?? niceSteps[niceSteps.length - 1];

  const ticks: number[] = [0];
  for (let t = interval; t < durationSec; t += interval) {
    ticks.push(t);
  }

  const last = ticks[ticks.length - 1];
  if (durationSec - last > interval * 0.15) {
    ticks.push(durationSec);
  } else if (last !== durationSec) {
    ticks[ticks.length - 1] = durationSec;
  }

  return ticks;
}

export function timelineSecToPercent(sec: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  return Math.min(100, Math.max(0, (sec / durationSec) * 100));
}

export type TimelineTickAlign = "start" | "center" | "end";

/** Edge ticks align flush; middle ticks stay centered on their position. */
export function timelineTickAlign(index: number, total: number): TimelineTickAlign {
  if (total <= 1) return "center";
  if (index === 0) return "start";
  if (index === total - 1) return "end";
  return "center";
}

export function timelineTickAlignClass(align: TimelineTickAlign): string {
  switch (align) {
    case "start":
      return "translate-x-0";
    case "end":
      return "-translate-x-full";
    default:
      return "-translate-x-1/2";
  }
}
