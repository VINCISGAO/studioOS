"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandPortalHeader } from "@/components/studioos/brand-portal-header";
import { BrandPortalSidebar } from "@/components/studioos/brand-portal-sidebar";
import { PortalContentColumn } from "@/components/studioos/portal/portal-content-column";
import { PortalViewportShell } from "@/components/studioos/portal/portal-viewport-shell";
import { buildAvatarInitials } from "@/lib/studioos/avatar-initials";
import { readBrandWizardStepFromLocation } from "@/lib/studioos/instant-nav";
import {
  isBrandPortalFocusRoute,
  isBrandPortalProjectReviewRoute,
  isBrandPortalWizardCreateRoute,
  parseReviewSearchParams
} from "@/lib/studioos/portal-focus-mode";
import { PORTAL_CONTENT_MAX, PORTAL_MAIN_SAFE_BOTTOM } from "@/lib/studioos/portal-layout-tokens";
import { brandPortalNavItems, type BrandPortalNavItem } from "@/lib/studioos/brand-portal-nav";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { PortalShellChromeProvider } from "@/components/studioos/portal-shell-chrome-context";
import { AcknowledgeAlertProvider } from "@/components/studioos/acknowledge-alert-provider";
import {
  ReviewFocusModeProvider,
  usePortalReviewFocus
} from "@/components/studioos/reviewer-skeleton/use-review-focus-mode";
import { brandNav } from "@/lib/studioos/vocabulary";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BrandPortalShell({
  locale,
  pathname: pathnameProp,
  search,
  unreadMessageCount = 0,
  brandAccount,
  children
}: {
  locale: Locale;
  pathname?: string;
  search: string;
  unreadMessageCount?: number;
  brandAccount?: { name: string; email: string; avatarUrl?: string } | null;
  children: React.ReactNode;
}) {
  return (
    <ReviewFocusModeProvider searchFallback={search}>
      <AcknowledgeAlertProvider locale={locale}>
        <BrandPortalShellInner
          locale={locale}
          pathname={pathnameProp}
          search={search}
          unreadMessageCount={unreadMessageCount}
          brandAccount={brandAccount}
        >
          {children}
        </BrandPortalShellInner>
      </AcknowledgeAlertProvider>
    </ReviewFocusModeProvider>
  );
}

function BrandPortalShellInner({
  locale,
  pathname: pathnameProp,
  search,
  unreadMessageCount = 0,
  brandAccount,
  children
}: {
  locale: Locale;
  pathname?: string;
  search: string;
  unreadMessageCount?: number;
  brandAccount?: { name: string; email: string; avatarUrl?: string } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? pathnameProp ?? "/brand";
  const { isFocusMode: isReviewFocusMode } = usePortalReviewFocus();
  const nav = brandNav[locale];
  const initials = buildAvatarInitials(brandAccount?.name, "BR");
  const avatarUrl = brandAccount?.avatarUrl;
  const isProjectReview = isBrandPortalProjectReviewRoute(pathname);
  const focusRoute = isBrandPortalFocusRoute(pathname);
  const isWizardCreate = isBrandPortalWizardCreateRoute(pathname);
  const [brandWizardStep, setBrandWizardStep] = useState(() => {
    if (!isBrandPortalWizardCreateRoute(pathname)) return 1;
    return Number(parseReviewSearchParams(search).get("step")) || 1;
  });
  const isProfileEditorPage =
    pathname === brandPortalRoutes.brandCenter ||
    pathname === brandPortalRoutes.brandProfile ||
    pathname === brandPortalRoutes.profile;
  const portalChrome = {
    initials,
    avatarUrl,
    userName: brandAccount?.name,
    profileHref: brandPortalRoutes.brandCenter,
    roleLabel: locale === "zh" ? "品牌方" : "Brand",
    unreadMessageCount,
    messagesHref: brandPortalRoutes.messages
  };

  useEffect(() => {
    if (!isWizardCreate) return;
    const syncStep = () => setBrandWizardStep(readBrandWizardStepFromLocation());
    syncStep();
    window.addEventListener("brand-wizard-step", syncStep);
    window.addEventListener("popstate", syncStep);
    return () => {
      window.removeEventListener("brand-wizard-step", syncStep);
      window.removeEventListener("popstate", syncStep);
    };
  }, [isWizardCreate, pathname]);

  function isActive(item: BrandPortalNavItem) {
    if (item.labelKey === "adRequirements") {
      return (
        isWizardCreate ||
        pathname === brandPortalRoutes.campaigns ||
        pathname.startsWith("/brand/campaigns/") ||
        pathname === brandPortalRoutes.dashboard
      );
    }
    if (item.labelKey === "team") {
      return pathname === brandPortalRoutes.brandTeam || pathname === brandPortalRoutes.team;
    }
    if (item.labelKey === "brandLibrary") {
      return pathname === brandPortalRoutes.brandCenter || pathname.startsWith("/brand/brand-center");
    }
    if (item.labelKey === "dataAnalysis" || item.labelKey === "attribution") {
      return pathname === brandPortalRoutes.attribution || pathname.startsWith("/brand/attribution");
    }
    if (item.labelKey === "messages") {
      return pathname === brandPortalRoutes.messages || pathname.startsWith("/brand/messages");
    }
    if (item.labelKey === "settings") {
      return pathname === brandPortalRoutes.settings || pathname.startsWith("/brand/settings");
    }
    if (item.labelKey === "brandAccount") {
      return pathname === brandPortalRoutes.financeAccount;
    }
    if (item.labelKey === "home") {
      return (
        !isWizardCreate &&
        (pathname === brandPortalRoutes.dashboard ||
          pathname.startsWith("/brand/projects") ||
          pathname.startsWith("/brand/campaigns")) &&
        !/\/brand\/projects\/[^/]+\/review/.test(pathname) &&
        !pathname.includes("/checkout")
      );
    }
    if (item.labelKey === "reviewRoom") {
      return pathname === brandPortalRoutes.reviewHub || /\/brand\/projects\/[^/]+\/review/.test(pathname);
    }
    if (item.labelKey === "finance") {
      return (
        pathname === brandPortalRoutes.finance ||
        (pathname.startsWith("/brand/finance") && pathname !== brandPortalRoutes.financeAccount) ||
        pathname.includes("/checkout")
      );
    }
    if (item.labelKey === "brandCenter") {
      return pathname === brandPortalRoutes.brandCenter || pathname.startsWith("/brand/brand-center");
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  if (isProjectReview && isReviewFocusMode) {
    return (
      <PortalShellChromeProvider value={portalChrome}>
        <PortalViewportShell mode="review-dvh" scrollLock>
          {children}
        </PortalViewportShell>
      </PortalShellChromeProvider>
    );
  }

  const showPortalHeader = !isProjectReview && !isWizardCreate;

  return (
    <PortalShellChromeProvider value={portalChrome}>
      <PortalViewportShell mode="fixed" scrollLock brandPortalRoot>
        <div className="flex h-full min-h-0 flex-1 overflow-hidden">
          <BrandPortalSidebar
            locale={locale}
            navLabels={nav}
            unreadMessageCount={unreadMessageCount}
            brandAccount={brandAccount}
            initials={initials}
            avatarUrl={avatarUrl}
            isActive={isActive}
          />

          <PortalContentColumn>
            {showPortalHeader ? (
              <BrandPortalHeader
                locale={locale}
                pathname={pathname}
                navLabels={nav}
                initials={initials}
                avatarUrl={avatarUrl}
                brandName={brandAccount?.name}
                unreadMessageCount={unreadMessageCount}
                isNavItemActive={isActive}
              />
            ) : null}

            <main
              data-brand-portal-main
              data-brand-wizard-step={isWizardCreate ? brandWizardStep : undefined}
              className={cn(
                "min-h-0 min-w-0 flex-1",
                isProjectReview && "flex w-full flex-col overflow-hidden p-0",
                isWizardCreate &&
                  "mx-auto flex h-full w-full max-w-none flex-col overflow-y-auto overscroll-y-contain p-0",
                !isProjectReview &&
                  !isWizardCreate &&
                  cn(
                    "mx-auto w-full overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
                    PORTAL_MAIN_SAFE_BOTTOM,
                    isProfileEditorPage ? "max-w-none" : focusRoute ? PORTAL_CONTENT_MAX.focus : PORTAL_CONTENT_MAX.default
                  )
              )}
            >
              {children}
            </main>
          </PortalContentColumn>
        </div>
      </PortalViewportShell>
    </PortalShellChromeProvider>
  );
}
