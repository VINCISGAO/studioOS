import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard-types";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";

/** Brand-facing ad lifecycle tabs under 我的广告 */
export type BrandAdLifecycleFilter =
  | "all"
  | "draft"
  | "recruiting"
  | "in_production"
  | "pending_review"
  | "completed"
  | "closed";

export const brandAdLifecycleFilters: BrandAdLifecycleFilter[] = [
  "all",
  "draft",
  "recruiting",
  "in_production",
  "pending_review",
  "completed",
  "closed"
];

export const brandAdLifecycleLabels = {
  en: {
    all: "All",
    draft: "Draft",
    recruiting: "Recruiting",
    in_production: "In production",
    pending_review: "Review & delivery",
    completed: "Completed",
    closed: "Closed"
  },
  zh: {
    all: "全部",
    draft: "草稿",
    recruiting: "招募中",
    in_production: "制作中",
    pending_review: "审核交付",
    completed: "已完成",
    closed: "已关闭"
  }
} as const;

export function brandAdLifecycleBucket(status: string): Exclude<BrandAdLifecycleFilter, "all"> {
  const normalized = normalizeCampaignStatus(status);

  if (normalized === "draft") return "draft";
  if (["matching", "studio_selected", "proposal", "contract_pending", "payment_pending"].includes(normalized)) {
    return "recruiting";
  }
  if (normalized === "production") return "in_production";
  if (["in_review", "delivered"].includes(normalized)) return "pending_review";
  if (normalized === "completed") return "completed";
  if (["cancelled", "disputed"].includes(normalized)) return "closed";

  return "recruiting";
}

export function filterBrandRowsByLifecycle(
  rows: BrandProjectRow[],
  filter: BrandAdLifecycleFilter
): BrandProjectRow[] {
  if (filter === "all") return rows;
  return rows.filter((row) => brandAdLifecycleBucket(String(row.status)) === filter);
}

export function countBrandRowsByLifecycle(rows: BrandProjectRow[]): Record<BrandAdLifecycleFilter, number> {
  const counts: Record<BrandAdLifecycleFilter, number> = {
    all: rows.length,
    draft: 0,
    recruiting: 0,
    in_production: 0,
    pending_review: 0,
    completed: 0,
    closed: 0
  };

  for (const row of rows) {
    counts[brandAdLifecycleBucket(String(row.status))] += 1;
  }

  return counts;
}

/** Rows that need brand action on the home dashboard */
export function brandPendingActionRows(rows: BrandProjectRow[]): BrandProjectRow[] {
  return rows.filter((row) => {
    const bucket = brandAdLifecycleBucket(String(row.status));
    return bucket === "pending_review" || bucket === "recruiting";
  });
}
