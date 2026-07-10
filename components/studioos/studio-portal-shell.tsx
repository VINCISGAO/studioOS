"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { NotificationCenterBell } from "@/components/studioos/notification-center-bell";
import { PortalMobileNav } from "@/components/studioos/portal-mobile-nav";
import { StudioUserMenu } from "@/components/studioos/studio-user-menu";
import { PortalSidebarAccountMenu } from "@/components/studioos/portal-sidebar-account-menu";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { CertifiedPartnerBadge } from "@/components/studioos/certification/certified-partner-badge";
import { StudioCertificationOrchestrator } from "@/components/studioos/certification/studio-certification-orchestrator";
import {
  CreatorSelectionOrchestrator,
  type PendingSelectionCelebration
} from "@/components/studioos/creator-selection-orchestrator";
import { StudioPortalSidebarNav } from "@/components/studioos/certification/studio-portal-sidebar-nav";
import { studioNav } from "@/lib/studioos/vocabulary";
import { buildAvatarInitials } from "@/lib/studioos/avatar-initials";
import { creatorPortalNavItems } from "@/lib/studioos/creator-portal-nav";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { isCreatorPortalReviewRoute } from "@/lib/studioos/portal-focus-mode";
import { PortalShellChromeProvider } from "@/components/studioos/portal-shell-chrome-context";
import {
  ReviewFocusModeProvider,
  usePortalReviewFocus
} from "@/components/studioos/reviewer-skeleton/use-review-focus-mode";
import { tCertificationExperience } from "@/lib/studioos/certification-experience-copy";
import type { Locale } from "@/lib/i18n";
import type { CreatorNotification } from "@/lib/notification-types";
import type { Creator } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StudioPortalShell({
  locale,
  pathname: pathnameProp,
  search,
  creator,
  creatorId,
  canUseBusinessFeatures = true,
  isVerified = false,
  levelUpSeen = true,
  notifications = [],
  unreadCount = 0,
  pendingInvitationCount = 0,
  pendingSelectionCelebration = null,
  children
}: {
  locale: Locale;
  pathname?: string;
  search: string;
  creator?: Creator | null;
  creatorId?: string | null;
  certificationPaid?: boolean;
  profileComplete?: boolean;
  canUseBusinessFeatures?: boolean;
  isVerified?: boolean;
  levelUpSeen?: boolean;
  notifications?: CreatorNotification[];
  unreadCount?: number;
  pendingInvitationCount?: number;
  pendingSelectionCelebration?: PendingSelectionCelebration | null;
  children: React.ReactNode;
}) {
  return (
    <ReviewFocusModeProvider searchFallback={search}>
      <StudioPortalShellInner
        key={`${pathnameProp ?? "studio"}?${search}`}
        locale={locale}
        pathname={pathnameProp}
        search={search}
        creator={creator}
        creatorId={creatorId}
        canUseBusinessFeatures={canUseBusinessFeatures}
        isVerified={isVerified}
        levelUpSeen={levelUpSeen}
        notifications={notifications}
        unreadCount={unreadCount}
        pendingInvitationCount={pendingInvitationCount}
        pendingSelectionCelebration={pendingSelectionCelebration}
      >
        {children}
      </StudioPortalShellInner>
    </ReviewFocusModeProvider>
  );
}

function StudioPortalShellInner({
  locale,
  pathname: pathnameProp,
  search,
  creator,
  creatorId,
  canUseBusinessFeatures = true,
  isVerified = false,
  levelUpSeen = true,
  notifications = [],
  unreadCount = 0,
  pendingInvitationCount = 0,
  pendingSelectionCelebration = null,
  children
}: {
  locale: Locale;
  pathname?: string;
  search: string;
  creator?: Creator | null;
  creatorId?: string | null;
  certificationPaid?: boolean;
  profileComplete?: boolean;
  canUseBusinessFeatures?: boolean;
  isVerified?: boolean;
  levelUpSeen?: boolean;
  notifications?: CreatorNotification[];
  unreadCount?: number;
  pendingInvitationCount?: number;
  pendingSelectionCelebration?: PendingSelectionCelebration | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? pathnameProp ?? "/studio";
  const { isFocusMode: isReviewFocusMode } = usePortalReviewFocus();
  const nav = studioNav[locale];
  const partnerBadge = tCertificationExperience(locale).partnerBadge;
  const partnerBadgeSidebar = tCertificationExperience(locale).partnerBadgeSidebar;
  const initials = buildAvatarInitials(creator?.name, "CR");
  const avatarUrl = creator?.avatar_url?.trim() || undefined;
  const visibleUnreadCount = unreadCount;

  const isReviewPage = isCreatorPortalReviewRoute(pathname);
  const hidePortalHeader = isReviewPage;
  const isProfileEditorPage = pathname === creatorPortalRoutes.profile;

  if (isReviewPage && isReviewFocusMode) {
    return (
      <PortalShellChromeProvider
        value={{
          initials,
          avatarUrl,
          userName: creator?.name,
          profileHref: creatorPortalRoutes.profile,
          roleLabel: isVerified ? partnerBadge : locale === "zh" ? "创作者" : "Creator",
          unreadMessageCount: unreadCount,
          showNotificationBell: canUseBusinessFeatures,
          notifications
        }}
      >
        <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#f8f9fb]">{children}</div>
      </PortalShellChromeProvider>
    );
  }

  const portalChrome = {
    initials,
    avatarUrl,
    userName: creator?.name,
    profileHref: creatorPortalRoutes.profile,
    roleLabel: isVerified ? partnerBadge : locale === "zh" ? "创作者" : "Creator",
    unreadMessageCount: unreadCount,
    showNotificationBell: canUseBusinessFeatures,
    notifications
  };

  const shellInner = (
    <PortalShellChromeProvider value={portalChrome}>
    <div className="min-h-screen bg-[#f8f9fb] lg:h-screen lg:overflow-hidden">
      <div className={cn("flex min-h-screen lg:h-screen lg:min-h-0 lg:overflow-hidden")}>
        <aside className="hidden h-screen w-[248px] shrink-0 flex-col overflow-hidden border-r border-zinc-200/80 bg-white lg:flex">
          <MarketingHomeLink
            locale={locale}
            className="flex shrink-0 items-center gap-2.5 px-5 py-5 transition hover:opacity-80"
          >
            <BrandLogoLockup
              contrastOn="light"
              markClassName="h-8 w-8 rounded-lg shadow-sm ring-1 ring-violet-100"
              wordmarkClassName="h-[17px] w-[106px]"
              priority
            />
            <div className="min-w-0">
              {isVerified ? (
                <CertifiedPartnerBadge
                  label={partnerBadgeSidebar}
                  compact
                  className="mt-1.5 bg-violet-50 text-violet-700 ring-violet-200/60"
                />
              ) : null}
            </div>
          </MarketingHomeLink>

          <StudioPortalSidebarNav
            locale={locale}
            pathname={pathname}
            canUseBusinessFeatures={canUseBusinessFeatures}
            isVerified={isVerified}
            unreadCount={visibleUnreadCount}
            pendingInvitationCount={pendingInvitationCount}
          />

          <div className="mt-auto shrink-0 border-t border-zinc-100 p-4">
            {creator ? (
              <PortalSidebarAccountMenu
                locale={locale}
                initials={initials}
                avatarUrl={avatarUrl}
                name={creator.name}
                roleLabel={locale === "zh" ? "创作者" : "Creator"}
                profileHref={creatorPortalRoutes.profile}
                accent={isVerified ? "violet" : "zinc"}
              />
            ) : null}
          </div>
        </aside>

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col lg:h-screen lg:overflow-hidden",
            isReviewPage && "h-[100dvh] max-h-[100dvh] overflow-hidden"
          )}
        >
          {!hidePortalHeader ? (
            <header className="sticky top-0 z-40 shrink-0 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
              <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 lg:hidden">
                  <MarketingHomeLink locale={locale} className="flex items-center gap-2 font-semibold text-zinc-950">
                    <BrandLogoLockup
                      contrastOn="light"
                      markClassName="h-6 w-6 rounded-md shadow-sm"
                      wordmarkClassName="h-[13px] w-[82px]"
                    />
                  </MarketingHomeLink>
                  {isVerified ? (
                    <CertifiedPartnerBadge
                      label={partnerBadgeSidebar}
                      compact
                      className="hidden bg-violet-50 text-[10px] text-violet-700 ring-violet-200/60 sm:inline-flex"
                    />
                  ) : null}
                </div>
                <div className="hidden lg:block" />

                <div className="flex items-center gap-2 sm:gap-3">
                  {canUseBusinessFeatures ? <NotificationCenterBell locale={locale} /> : null}
                  <StudioUserMenu
                    locale={locale}
                    initials={initials}
                    avatarUrl={avatarUrl}
                    name={creator?.name}
                    profileHref={creatorPortalRoutes.profile}
                    roleLabel={isVerified ? partnerBadge : locale === "zh" ? "创作者" : "Creator"}
                  />
                </div>
              </div>

              <div className="border-t border-zinc-100 px-4 py-3 lg:hidden">
                <PortalMobileNav
                  locale={locale}
                  pathname={pathname}
                  items={creatorPortalNavItems.map(({ href, labelKey, mobileIconKey, requiresBusinessAccess }) => ({
                    id: labelKey,
                    href:
                      requiresBusinessAccess && !canUseBusinessFeatures
                        ? creatorPortalRoutes.deposit
                        : href,
                    label: nav[labelKey],
                    iconKey:
                      requiresBusinessAccess && !canUseBusinessFeatures ? ("lock" as const) : mobileIconKey
                  }))}
                />
              </div>
            </header>
          ) : null}

          <main
            className={cn(
              "min-h-0 min-w-0 flex-1",
              isReviewPage
                ? "flex w-full flex-col overflow-hidden p-0"
                : cn(
                    "mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 lg:overflow-y-auto",
                    isProfileEditorPage ? "max-w-none" : "max-w-[1280px]"
                  )
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
    </PortalShellChromeProvider>
  );

  if (!creatorId) {
    return shellInner;
  }

  return (
    <Suspense fallback={shellInner}>
      <StudioCertificationOrchestrator
        locale={locale}
        creatorId={creatorId}
        isVerified={isVerified}
        levelUpSeen={levelUpSeen}
      >
        <CreatorSelectionOrchestrator
          locale={locale}
          pendingCelebration={pendingSelectionCelebration}
        >
          {shellInner}
        </CreatorSelectionOrchestrator>
      </StudioCertificationOrchestrator>
    </Suspense>
  );
}
