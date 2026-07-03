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
  creatorPortalNavItems,
  type CreatorPortalNavItem
} from "@/lib/studioos/creator-portal-nav";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { studioNav } from "@/lib/studioos/vocabulary";
import { cn } from "@/lib/utils";
import { Lock, Sparkles } from "lucide-react";

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
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  function sidebarLinkClass(active: boolean, locked: boolean, certified: boolean) {
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

  return (
    <nav className="min-h-0 flex-1 space-y-0.5 overflow-hidden px-3">
      {creatorPortalNavItems.map((item) => {
        const { labelKey, icon: Icon, showUnreadDot } = item;
        const active = isActive(item);
        const locked = isNavLocked(item);
        const justUnlocked = isAnimating && unlockedSet.has(labelKey);
        const certifiedItem = isVerified && !locked;
        const ItemIcon = locked ? Lock : justUnlocked ? Sparkles : Icon;

        return (
          <Link
            key={item.href + labelKey}
            href={navHref(item)}
            className={sidebarLinkClass(active && !locked, locked, certifiedItem)}
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
            {active && !locked ? (
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
                active && !locked && certifiedItem && "text-violet-700"
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
      })}
    </nav>
  );
}
