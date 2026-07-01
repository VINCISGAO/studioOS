import Link from "next/link";
import { Suspense } from "react";
import { signOutAction } from "@/app/actions";
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
import { isCreatorPortalReviewRoute } from "@/lib/studioos/portal-focus-mode";
import { tCertificationExperience } from "@/lib/studioos/certification-experience-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { CreatorNotification } from "@/lib/notification-types";
import type { Creator } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";

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
  withdrawableUsd = 0,
  pendingInvitationCount = 0,
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
  withdrawableUsd?: number;
  pendingInvitationCount?: number;
  children: React.ReactNode;
}) {
  const nav = studioNav[locale];
  const partnerBadge = tCertificationExperience(locale).partnerBadge;
  const initials = creator ? studioInitials(creator.name) : "CR";

  const isReviewPage = isCreatorPortalReviewRoute(pathname);

  const shellInner = (
    <div
      className={cn(
        isReviewPage
          ? "max-lg:h-screen max-lg:overflow-hidden bg-white lg:min-h-screen lg:bg-[#f8f9fb]"
          : "min-h-screen bg-[#f8f9fb]"
      )}
    >
      <div className={cn("flex", isReviewPage ? "max-lg:h-full lg:min-h-screen" : "min-h-screen")}>
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
                  {locale === "zh" ? "创作者后台" : "Creator"}
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
            pendingInvitationCount={pendingInvitationCount}
          />

          <div className="mt-auto space-y-3 border-t border-zinc-100 p-4">
            {canUseBusinessFeatures ? (
              <Link
                href={withLocale(creatorPortalRoutes.income, locale)}
                className="block rounded-xl border border-violet-100 bg-violet-50/70 p-3 transition hover:bg-violet-50"
              >
                <p className="text-xs text-zinc-500">{locale === "zh" ? "可提现金额" : "Withdrawable"}</p>
                <p className="mt-1 text-lg font-semibold text-zinc-950">{formatCurrency(withdrawableUsd)}</p>
                <p className="mt-1 text-xs font-medium text-violet-600">
                  {locale === "zh" ? "去提现" : "Withdraw"} <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                </p>
              </Link>
            ) : null}
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
              <p className="text-xs text-zinc-500">{locale === "zh" ? "创作者等级" : "Creator level"}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                {locale === "zh" ? "Lv.2 专业创作者" : "Lv.2 Pro creator"}
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-zinc-200">
                <div className="h-full w-[72%] rounded-full bg-violet-600" />
              </div>
              <p className="mt-1 text-[10px] text-zinc-500">
                {locale === "zh" ? "还需 1,121 积分升级" : "1,121 points to level up"}
              </p>
            </div>
            <div className="space-y-2 px-1 text-[11px] text-zinc-400">
              <p>StudioOS © 2025</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <Link href={withLocale("/#faq", locale)} className="hover:text-zinc-600">
                  {locale === "zh" ? "帮助中心" : "Help center"}
                </Link>
                <form action={signOutAction}>
                  <button type="submit" className="hover:text-zinc-600">
                    {locale === "zh" ? "退出登录" : "Sign out"}
                  </button>
                </form>
              </div>
            </div>
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
              ) : null}
              <div className="hidden lg:block" />

              <div className={cn("flex items-center gap-2 sm:gap-3", isReviewPage && "max-lg:ml-auto")}>
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
            ) : null}
          </header>

          <main
            className={cn(
              "min-h-0 min-w-0 flex-1",
              isReviewPage
                ? "flex flex-col overflow-hidden p-0 lg:px-8 lg:py-8"
                : cn(
                    "mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
                    "max-w-[1280px]"
                  )
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
