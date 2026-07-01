import { Suspense } from "react";
import { PortalMobileNav } from "@/components/studioos/portal-mobile-nav";
import { StudioNotificationBell } from "@/components/studioos/studio-notification-bell";
import { StudioUserMenu } from "@/components/studioos/studio-user-menu";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { LanguageSwitcher, LanguageSwitcherFallback } from "@/components/language-switcher";
import { CertifiedPartnerBadge } from "@/components/studioos/certification/certified-partner-badge";
import { StudioCertificationOrchestrator } from "@/components/studioos/certification/studio-certification-orchestrator";
import { StudioPortalSidebarNav } from "@/components/studioos/certification/studio-portal-sidebar-nav";
import { studioNav, studioOS } from "@/lib/studioos/vocabulary";
import { creatorPortalNavItems } from "@/lib/studioos/creator-portal-nav";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { tCertificationExperience } from "@/lib/studioos/certification-experience-copy";
import type { Locale } from "@/lib/i18n";
import type { CreatorNotification } from "@/lib/notification-types";
import type { Creator } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Lock, Sparkles } from "lucide-react";

function studioInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function StudioPortalShell({
  locale,
  pathname,
  search,
  creator,
  creatorId,
  canUseBusinessFeatures = true,
  isVerified = false,
  levelUpSeen = true,
  notifications = [],
  unreadCount = 0,
  children
}: {
  locale: Locale;
  pathname: string;
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
  children: React.ReactNode;
}) {
  const nav = studioNav[locale];
  const partnerBadge = tCertificationExperience(locale).partnerBadge;
  const initials = creator ? studioInitials(creator.name) : "CR";

  const isReviewPage =
    /\/workspace\/projects\/[^/]+\/review$/.test(pathname) ||
    /\/studio\/review\/[^/]+$/.test(pathname);

  const shellInner = (
    <div className={cn(isReviewPage ? "h-screen overflow-hidden bg-white" : "min-h-screen bg-[#f4f7fb]")}>
      <div className={cn("flex", isReviewPage ? "h-full" : "min-h-screen")}>
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-zinc-200/80 bg-white lg:flex">
          <MarketingHomeLink
            locale={locale}
            className="flex items-center gap-2.5 px-5 py-5 transition hover:opacity-80"
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm",
                isVerified ? "bg-violet-600" : "bg-indigo-600"
              )}
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-950">{studioOS.productName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                  {locale === "zh" ? "创作者" : "Creator"}
                </span>
                {isVerified ? <CertifiedPartnerBadge label={partnerBadge} compact /> : null}
              </div>
            </div>
          </MarketingHomeLink>

          <StudioPortalSidebarNav
            locale={locale}
            pathname={pathname}
            canUseBusinessFeatures={canUseBusinessFeatures}
            isVerified={isVerified}
            unreadCount={unreadCount}
          />

          <div className="mt-auto border-t border-zinc-100 p-4">
            {creator ? (
              <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                    isVerified ? "bg-violet-600" : "bg-zinc-900"
                  )}
                >
                  {initials.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{creator.name}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {isVerified ? partnerBadge : nav.studioOwner}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 shrink-0 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
            <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
              {!isReviewPage ? (
                <div className="flex items-center gap-2 lg:hidden">
                  <MarketingHomeLink locale={locale} className="flex items-center gap-2 font-semibold text-zinc-950">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-white",
                        isVerified ? "bg-violet-600" : "bg-indigo-600"
                      )}
                    >
                      <Sparkles className="h-4 w-4" />
                    </span>
                    {studioOS.productName}
                  </MarketingHomeLink>
                  {isVerified ? (
                    <CertifiedPartnerBadge label={partnerBadge} compact className="hidden sm:inline-flex" />
                  ) : null}
                </div>
              ) : (
                <div className="hidden lg:block" />
              )}
              {!isReviewPage ? <div className="hidden lg:block" /> : null}

              <div className={cn("flex items-center gap-2 sm:gap-3", isReviewPage && "ml-auto")}>
                <Suspense fallback={<LanguageSwitcherFallback locale={locale} />}>
                  <LanguageSwitcher locale={locale} pathname={pathname} search={search} />
                </Suspense>
                {canUseBusinessFeatures ? (
                  <StudioNotificationBell
                    locale={locale}
                    notifications={notifications}
                    unreadCount={unreadCount}
                  />
                ) : null}
                <StudioUserMenu
                  locale={locale}
                  initials={initials}
                  name={creator?.name}
                  profileHref={creatorPortalRoutes.profile}
                  roleLabel={isVerified ? partnerBadge : locale === "zh" ? "创作者" : "Creator"}
                />
              </div>
            </div>

            {!isReviewPage ? (
              <div className="border-t border-zinc-100 px-4 py-3 lg:hidden">
                <PortalMobileNav
                  locale={locale}
                  pathname={pathname}
                  items={creatorPortalNavItems.map(({ href, labelKey, icon, requiresBusinessAccess }) => ({
                    id: labelKey,
                    href:
                      requiresBusinessAccess && !canUseBusinessFeatures
                        ? creatorPortalRoutes.deposit
                        : href,
                    label: nav[labelKey],
                    icon: requiresBusinessAccess && !canUseBusinessFeatures ? Lock : icon
                  }))}
                />
              </div>
            ) : null}
          </header>

          <main
            className={cn(
              "min-h-0 min-w-0 flex-1",
              isReviewPage ? "flex flex-col overflow-hidden p-0" : "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );

  if (!creatorId) {
    return shellInner;
  }

  return (
    <StudioCertificationOrchestrator
      locale={locale}
      creatorId={creatorId}
      isVerified={isVerified}
      levelUpSeen={levelUpSeen}
    >
      {shellInner}
    </StudioCertificationOrchestrator>
  );
}
