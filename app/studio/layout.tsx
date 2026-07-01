import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StudioPortalShell } from "@/components/studioos/studio-portal-shell";
import { getCurrentCreator } from "@/lib/creator-session";
import {
  countCompletedCreatorOrders,
  getCreatorAccessState,
  hasCompletedCreatorProfile,
  requiresCreatorCertification
} from "@/lib/studioos/deposit-guard";
import {
  hasSeenCertificationLevelUp
} from "@/lib/studioos/creator-settings-service";
import { getLocale, withLocale } from "@/lib/i18n";
import { listOrdersForCreator } from "@/lib/order-service";
import { countUnreadNotifications, listNotificationsForCreator } from "@/lib/notification-service";
import { countInvitationsByTab, listInvitationsForCreator } from "@/lib/studioos/creator-invitation-store";
import { getCreatorIncomeSnapshot } from "@/lib/studioos/withdrawal-service";
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
  const orders = creator ? await listOrdersForCreator(creator.id) : [];
  const completedOrders = countCompletedCreatorOrders(orders);
  const access = getCreatorAccessState(creator, completedOrders);
  const profileComplete = hasCompletedCreatorProfile(creator);
  const canUseBusinessFeatures = access.canUseBusinessFeatures;
  const notifications =
    creator && canUseBusinessFeatures ? await listNotificationsForCreator(creator.id, locale) : [];
  const unreadCount =
    creator && canUseBusinessFeatures ? await countUnreadNotifications(creator.id) : 0;
  const income = creator && canUseBusinessFeatures ? await getCreatorIncomeSnapshot(creator.id) : null;
  const invitationCounts =
    creator && canUseBusinessFeatures
      ? countInvitationsByTab(await listInvitationsForCreator(creator.id))
      : { pending: 0, accepted: 0, declined: 0, expired: 0 };
  const levelUpSeen = creator ? await hasSeenCertificationLevelUp(creator.id) : true;

  if (creator && isStudioFeaturePath(pathname)) {
    if (requiresCreatorCertification(creator, completedOrders)) {
      redirect(withLocale(studioCertificationRedirectPath(locale), locale));
    }
    if (access.isVerified && !profileComplete) {
      redirect(withLocale(studioProfileOnboardingPath(locale), locale));
    }
  }

  return (
    <StudioPortalShell
      locale={locale}
      pathname={pathname}
      search={search}
      creator={creator}
      creatorId={creator?.id ?? null}
      certificationPaid={access.isVerified}
      profileComplete={profileComplete}
      canUseBusinessFeatures={canUseBusinessFeatures}
      isVerified={access.isVerified}
      levelUpSeen={levelUpSeen}
      notifications={notifications}
      unreadCount={unreadCount}
      withdrawableUsd={income?.available_usd ?? 0}
      pendingInvitationCount={invitationCounts.pending}
    >
      {children}
    </StudioPortalShell>
  );
}
