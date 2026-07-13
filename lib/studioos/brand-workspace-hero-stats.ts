import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard-types";

export function computeBrandWorkspaceHeroStats(rows: BrandProjectRow[]) {
  const total = rows.length;
  const drafts = rows.filter((row) => row.phase === "draft").length;
  const active = rows.filter((row) => row.phase === "active").length;
  return { total, drafts, active };
}
