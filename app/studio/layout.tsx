import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/studio";
  const search = headerList.get("x-search") ?? "";
  const locale = getLocale({ lang: new URLSearchParams(search).get("lang") ?? undefined });
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

  if (creator && isStudioFeaturePath(pathname)) {
    if (!certificationPaid) {
      redirect(withLocale(studioCertificationRedirectPath(locale), locale));
    }
    if (!profileComplete) {
      redirect(withLocale(studioProfileOnboardingPath(locale), locale));
    }
  }

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
