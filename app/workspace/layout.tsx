import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BrandReviewShell } from "@/components/mvp/brand-review-shell";
import { AdminPortalShell } from "@/components/studioos/admin-portal-shell";
import { BrandPortalShell } from "@/components/studioos/brand-portal-shell";
import { StudioPortalShell } from "@/components/studioos/studio-portal-shell";
import { getCurrentCreator } from "@/lib/creator-session";
import {
  hasCompletedCreatorProfile,
  hasPaidCreatorDeposit
} from "@/lib/studioos/deposit-guard";
import { getLocale, withLocale } from "@/lib/i18n";
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
  const certificationPaid = hasPaidCreatorDeposit(creator);
  const profileComplete = hasCompletedCreatorProfile(creator);

  const notifications =
    creator && certificationPaid && profileComplete
      ? await listNotificationsForCreator(creator.id, locale)
      : [];
  const unreadCount =
    creator && certificationPaid && profileComplete
      ? await countUnreadNotifications(creator.id)
      : 0;

  if (profile?.role === "studio" && creator && isStudioFeaturePath(pathname)) {
    if (!certificationPaid) {
      redirect(withLocale(studioCertificationRedirectPath(locale), locale));
    }
    if (!profileComplete) {
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
          certificationPaid={certificationPaid}
          profileComplete={profileComplete}
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
        certificationPaid={certificationPaid}
        profileComplete={profileComplete}
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
