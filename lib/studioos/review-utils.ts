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
