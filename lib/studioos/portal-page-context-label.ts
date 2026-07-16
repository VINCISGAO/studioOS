import type { Locale } from "@/lib/i18n";
import { brandNav, studioNav } from "@/lib/studioos/vocabulary";

function normalizePortalPath(pathname: string) {
  return pathname.split("?")[0]?.replace(/\/$/, "") || "/";
}

/** Sidebar-aligned label for brand portal routes (pathname only, no locale prefix). */
export function resolveBrandPortalPageLabel(pathname: string, locale: Locale): string {
  const labels = brandNav[locale];
  const path = normalizePortalPath(pathname);

  if (path === "/brand" || path === "/brand/campaigns" || path.startsWith("/brand/campaigns/")) {
    return labels.adRequirements;
  }
  if (path.startsWith("/brand/brand-center") || path === "/brand/profile") {
    return labels.brandCenter;
  }
  if (
    path === "/brand/review" ||
    /^\/brand\/projects\/[^/]+\/review/.test(path) ||
    /^\/brand\/orders\/[^/]+\/review/.test(path)
  ) {
    return labels.reviewRoom;
  }
  if (path.startsWith("/brand/finance/account")) {
    return labels.brandAccount;
  }
  if (path.startsWith("/brand/finance") || path === "/brand/settlement" || path === "/brand/invoices") {
    return labels.finance;
  }
  if (path.startsWith("/brand/attribution")) {
    return labels.attribution;
  }
  if (path.startsWith("/brand/messages")) {
    return labels.messages;
  }
  if (path.startsWith("/brand/settings")) {
    return labels.settings;
  }
  if (path === "/brand/projects/new" || path.startsWith("/brand/brief") || path.startsWith("/brand/start-brief")) {
    return labels.newBrief;
  }
  if (path.startsWith("/brand/projects")) {
    return locale === "zh" ? "广告项目" : "Ad project";
  }
  if (path.startsWith("/brand/ai") || path.startsWith("/brand/copilot")) {
    return labels.aiAssistant;
  }

  return labels.adRequirements;
}

/** Sidebar-aligned label for creator / studio portal routes. */
export function resolveStudioPortalPageLabel(pathname: string, locale: Locale): string {
  const labels = studioNav[locale];
  const path = normalizePortalPath(pathname);

  if (path === "/studio" || path === "/creator") {
    return labels.home;
  }
  if (path.startsWith("/studio/invitations")) {
    return labels.invitations;
  }
  if (path.startsWith("/studio/projects")) {
    return path.split("/").length > 3 ? labels.projectDetails : labels.projects;
  }
  if (path.startsWith("/studio/review") || /^\/studio\/orders\/[^/]+\/review/.test(path)) {
    return labels.reviewRoom;
  }
  if (path.startsWith("/studio/income")) {
    return labels.income;
  }
  if (path.startsWith("/studio/deposit")) {
    return labels.deposit;
  }
  if (path.startsWith("/studio/messages")) {
    return labels.messages;
  }
  if (path.startsWith("/studio/works") || path.startsWith("/studio/profile")) {
    return labels.works;
  }
  if (path.startsWith("/studio/settings")) {
    return labels.settings;
  }
  if (path.startsWith("/studio/ai") || path.startsWith("/studio/copilot")) {
    return labels.aiAssistant;
  }
  if (path.startsWith("/studio/upload") || path.startsWith("/studio/delivery")) {
    return labels.upload;
  }

  return labels.home;
}

export function portalPageContextLabel(pathname: string, locale: Locale): string {
  const path = normalizePortalPath(pathname);

  if (path.startsWith("/brand")) {
    const prefix = locale === "zh" ? "当前：" : "Current: ";
    return `${prefix}${resolveBrandPortalPageLabel(path, locale)}`;
  }
  if (path.startsWith("/studio") || path.startsWith("/creator")) {
    const prefix = locale === "zh" ? "当前：" : "Current: ";
    return `${prefix}${resolveStudioPortalPageLabel(path, locale)}`;
  }
  if (path.startsWith("/admin")) {
    return locale === "zh" ? "当前：管理后台" : "Current: Admin";
  }

  return locale === "zh" ? "当前：VINCIS" : "Current: VINCIS";
}
