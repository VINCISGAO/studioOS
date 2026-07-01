import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BrandReviewShell } from "@/components/mvp/brand-review-shell";
import { AdminPortalShell } from "@/components/studioos/admin-portal-shell";
import { BrandPortalShell } from "@/components/studioos/brand-portal-shell";
import { StudioPortalShell } from "@/components/studioos/studio-portal-shell";
import { getCurrentCreator } from "@/lib/creator-session";
import {
  countCompletedCreatorOrders,
  getCreatorAccessState,
  hasCompletedCreatorProfile,
  requiresCreatorCertification
} from "@/lib/studioos/deposit-guard";
import { getLocale, withLocale } from "@/lib/i18n";
import { listOrdersForCreator } from "@/lib/order-service";
import { countUnreadNotifications, listNotificationsForCreator } from "@/lib/notification-service";
import {
  isStudioFeaturePath,
  studioCertificationRedirectPath,
  studioProfileOnboardingPath
} from "@/lib/studioos/studio-access";
import { getMvpProfile } from "@/lib/mvp/session";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/workspace";
  const search = headerList.get("x-search") ?? "";
  const locale = getLocale({ lang: new URLSearchParams(search).get("lang") ?? undefined });

  let profile = null;
  try {
    profile = await getMvpProfile();
  } catch {
    profile = null;
  }

  const reviewMatch = pathname.match(/\/workspace\/projects\/([^/]+)\/review$/);
  const isReviewRoom = Boolean(reviewMatch);
  const creator = await getCurrentCreator();
  const orders = creator ? await listOrdersForCreator(creator.id) : [];
  const completedOrders = countCompletedCreatorOrders(orders);
  const access = getCreatorAccessState(creator, completedOrders);
  const profileComplete = hasCompletedCreatorProfile(creator);
  const canUseBusinessFeatures = access.canUseBusinessFeatures;

  const notifications =
    creator && canUseBusinessFeatures ? await listNotificationsForCreator(creator.id, locale) : [];
  const unreadCount =
    creator && canUseBusinessFeatures ? await countUnreadNotifications(creator.id) : 0;

  if (profile?.role === "studio" && creator && isStudioFeaturePath(pathname)) {
    if (requiresCreatorCertification(creator, completedOrders)) {
      redirect(withLocale(studioCertificationRedirectPath(locale), locale));
    }
    if (access.isVerified && !profileComplete) {
      redirect(withLocale(studioProfileOnboardingPath(locale), locale));
    }
  }

  if (profile && isReviewRoom) {
    if (profile.role === "brand") {
      return (
        <BrandReviewShell locale={locale} pathname={pathname} search={search} profile={profile} reviewMode>
          {children}
        </BrandReviewShell>
      );
    }

    if (profile.role === "studio") {
      return (
        <StudioPortalShell
          locale={locale}
          pathname={pathname}
          search={search}
          creator={creator}
          certificationPaid={access.isVerified}
          profileComplete={profileComplete}
          canUseBusinessFeatures={canUseBusinessFeatures}
          notifications={notifications}
          unreadCount={unreadCount}
        >
          {children}
        </StudioPortalShell>
      );
    }

    return <div className="flex h-screen flex-col overflow-hidden bg-white text-zinc-900">{children}</div>;
  }

  if (profile?.role === "studio") {
    return (
      <StudioPortalShell
        locale={locale}
        pathname={pathname}
        search={search}
        creator={creator}
        certificationPaid={access.isVerified}
        profileComplete={profileComplete}
        canUseBusinessFeatures={canUseBusinessFeatures}
        notifications={notifications}
        unreadCount={unreadCount}
      >
        {children}
      </StudioPortalShell>
    );
  }

  if (profile?.role === "brand") {
    return (
      <BrandPortalShell locale={locale} pathname={pathname} search={search}>
        {children}
      </BrandPortalShell>
    );
  }

  if (profile?.role === "admin") {
    return (
      <AdminPortalShell locale={locale} pathname={pathname} search={search}>
        {children}
      </AdminPortalShell>
    );
  }

  return <div className="min-h-screen bg-white text-zinc-900">{children}</div>;
}
