"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useCertificationExperience } from "@/components/studioos/certification/certification-experience-context";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  certificationUnlockOrder,
  tCertificationExperience
} from "@/lib/studioos/certification-experience-copy";
import {
  creatorPortalAiToolsNavItems,
  creatorPortalMainNavItems,
  type CreatorPortalNavItem
} from "@/lib/studioos/creator-portal-nav";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { studioNav } from "@/lib/studioos/vocabulary";
import { cn } from "@/lib/utils";
import { Lock, Sparkles } from "lucide-react";

function isAiToolsItem(item: CreatorPortalNavItem) {
  return item.labelKey === "infiniteCanvas" || item.labelKey === "tokenManagement";
}

export function StudioPortalSidebarNav({
  locale,
  pathname: pathnameProp,
  canUseBusinessFeatures,
  isVerified,
  unreadCount,
  pendingInvitationCount = 0
}: {
  locale: Locale;
  pathname: string;
  canUseBusinessFeatures: boolean;
  isVerified: boolean;
  unreadCount: number;
  pendingInvitationCount?: number;
}) {
  const nav = studioNav[locale];
  const t = tCertificationExperience(locale);
  const { unlockedNavKeys, isAnimating } = useCertificationExperience();
  const pathnameFromRouter = usePathname();
  const pathname = pathnameFromRouter ?? pathnameProp;

  const unlockedSet = useMemo(() => {
    if (isAnimating) {
      return unlockedNavKeys;
    }
    if (canUseBusinessFeatures) {
      return new Set(certificationUnlockOrder);
    }
    return new Set<string>();
  }, [canUseBusinessFeatures, isAnimating, unlockedNavKeys]);

  function navHref(item: CreatorPortalNavItem) {
    if (item.requiresBusinessAccess && !canUseBusinessFeatures && !isAnimating) {
      return withLocale(creatorPortalRoutes.deposit, locale);
    }
    return withLocale(item.href, locale);
  }

  function isNavLocked(item: CreatorPortalNavItem) {
    if (canUseBusinessFeatures && !isAnimating) {
      return false;
    }
    if (!item.requiresBusinessAccess) {
      return false;
    }
    if (isAnimating) {
      return !unlockedSet.has(item.labelKey);
    }
    return !canUseBusinessFeatures;
  }

  function isActive(item: CreatorPortalNavItem) {
    if (item.labelKey === "home") {
      return pathname === creatorPortalRoutes.home;
    }
    if (item.labelKey === "projectDetails" || item.labelKey === "projects") {
      return (
        pathname === creatorPortalRoutes.projects ||
        pathname.startsWith(`${creatorPortalRoutes.projects}/`)
      );
    }
    if (item.labelKey === "orders" || item.labelKey === "invitations") {
      return (
        pathname === creatorPortalRoutes.invitations ||
        pathname.startsWith(`${creatorPortalRoutes.invitations}/`)
      );
    }
    if (item.labelKey === "reviewRoom") {
      return pathname === creatorPortalRoutes.reviewHub || pathname.startsWith("/studio/review/");
    }
    if (item.labelKey === "infiniteCanvas") {
      return (
        pathname === creatorPortalRoutes.canvasEnter ||
        pathname === creatorPortalRoutes.canvas ||
        pathname.startsWith(`${creatorPortalRoutes.canvas}/`)
      );
    }
    if (item.labelKey === "tokenManagement") {
      return (
        pathname === creatorPortalRoutes.credits ||
        pathname.startsWith(`${creatorPortalRoutes.credits}/`)
      );
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  function sidebarLinkClass(
    active: boolean,
    locked: boolean,
    certified: boolean,
    accent: "default" | "aiTools"
  ) {
    if (accent === "aiTools" && !locked) {
      return cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
        active
          ? "bg-blue-50 text-blue-700 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.12)]"
          : "text-zinc-600 hover:bg-blue-50/60 hover:text-blue-700"
      );
    }
    return cn(
      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
      locked
        ? "text-zinc-400"
        : active
          ? certified
            ? "bg-violet-50 text-violet-700 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.1)]"
            : "bg-zinc-100/80 text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
    );
  }

  function renderNavItem(item: CreatorPortalNavItem) {
    const { labelKey, icon: Icon, showUnreadDot } = item;
    const active = isActive(item);
    const locked = isNavLocked(item);
    const justUnlocked = isAnimating && unlockedSet.has(labelKey);
    const certifiedItem = isVerified && !locked;
    const accent = isAiToolsItem(item) ? "aiTools" : "default";
    const ItemIcon = locked ? Lock : justUnlocked ? Sparkles : Icon;

    return (
      <Link
        key={item.href + labelKey}
        href={navHref(item)}
        className={sidebarLinkClass(active && !locked, locked, certifiedItem, accent)}
        title={
          locked && !isAnimating
            ? item.labelKey === "income"
              ? undefined
              : locale === "zh"
                ? "首单完成后需成为认证服务商才能继续接单"
                : "Certify after your free order to accept more projects"
            : undefined
        }
      >
        {accent === "aiTools" && active && !locked ? (
          <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-blue-500" />
        ) : active && !locked && accent === "default" ? (
          <span
            className={cn(
              "absolute bottom-2 left-0 top-2 w-[3px] rounded-full",
              certifiedItem ? "bg-violet-500" : "bg-zinc-900"
            )}
          />
        ) : null}
        <ItemIcon
          className={cn(
            "h-[18px] w-[18px] shrink-0",
            justUnlocked && "text-violet-600",
            accent === "aiTools" && active && !locked && "text-blue-600",
            accent === "aiTools" && !active && !locked && "text-blue-500/80",
            active && !locked && certifiedItem && accent === "default" && "text-violet-700"
          )}
        />
        <span className="flex-1">{nav[labelKey]}</span>
        {justUnlocked ? (
          <span className="text-[10px] font-medium text-violet-600">{t.unlockLabel}</span>
        ) : null}
        {showUnreadDot && unreadCount > 0 && !locked ? (
          <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
        {labelKey === "orders" && pendingInvitationCount > 0 && !locked ? (
          <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {pendingInvitationCount}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <nav className="flex min-h-0 flex-1 flex-col overflow-hidden px-3">
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {creatorPortalMainNavItems.map((item) => renderNavItem(item))}
      </div>

      <div className="mt-3 shrink-0 border-t border-zinc-100 pt-3">
        <div className="mb-1.5 px-3 text-[11px] font-semibold tracking-wide text-blue-500">
          {nav.aiTools}
        </div>
        <div className="space-y-0.5">
          {creatorPortalAiToolsNavItems.map((item) => renderNavItem(item))}
        </div>
      </div>
    </nav>
  );
}
