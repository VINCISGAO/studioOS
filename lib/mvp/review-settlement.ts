import type { ProjectStatus, ReviewProject } from "@/lib/mvp/types";

export function isReviewPhase(status: ProjectStatus) {
  return status === "in_review" || status === "revision";
}

export function isPendingSettlement(status: ProjectStatus) {
  return status === "pending_settlement" || status === "approved";
}

export function isSettled(status: ProjectStatus) {
  return status === "settled" || status === "delivered";
}

export function canDownloadMaster(project: ReviewProject) {
  return isSettled(project.status) && Boolean(project.master_file_url);
}

export function reviewIsLocked(status: ProjectStatus) {
  return isPendingSettlement(status) || isSettled(status);
}

export function projectStatusLabel(status: ProjectStatus, locale: "en" | "zh") {
  const zh: Record<ProjectStatus, string> = {
    draft: "草稿",
    in_review: "审片中",
    revision: "修改中",
    pending_settlement: "待结算",
    settled: "已结算",
    approved: "待结算",
    delivered: "已结算"
  };
  const en: Record<ProjectStatus, string> = {
    draft: "Draft",
    in_review: "In review",
    revision: "Revisions",
    pending_settlement: "Pending settlement",
    settled: "Settled",
    approved: "Pending settlement",
    delivered: "Settled"
  };
  return (locale === "zh" ? zh : en)[status] ?? status;
}
