export function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function latestDeliverableVersion(
  deliverables: Array<{ version: number }>
): number {
  return deliverables.reduce((max, item) => Math.max(max, item.version), 0) || 1;
}

/** Frame.io-style timecode HH:MM:SS:FF (default 24fps). */
export function formatTimecode(sec: number, fps = 24): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const f = Math.min(fps - 1, Math.floor((sec % 1) * fps));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}
