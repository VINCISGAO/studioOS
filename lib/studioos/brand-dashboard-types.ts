import type { CampaignProjectStatus } from "@/lib/studioos/project-status";

export type BrandDashboardMetrics = {
  projectCount: number;
  adsDelivered: number;
  avgProductionDays: number;
  monthSpend: number;
};

export type BrandProjectRow = {
  id: string;
  kind: "campaign" | "order";
  name: string;
  status: CampaignProjectStatus | string;
  updatedAt: string;
  href: string;
  cta: string;
  category?: string;
  budgetRange?: string;
  deadline?: string;
  wizardStep?: number;
  progress?: number;
  canDelete?: boolean;
  paymentExpired?: boolean;
  phase: "draft" | "active" | "done";
  thumbnailUrl?: string;
};
