import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StudioPortalShell } from "@/components/studioos/studio-portal-shell";
import { getCurrentCreator } from "@/lib/creator-session";
import {
  hasCompletedCreatorProfile
} from "@/lib/studioos/deposit-guard";
import { resolveCreatorCertificationAccessFromOrders } from "@/lib/studioos/creator-certification-access";
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
  const access = creator
    ? await resolveCreatorCertificationAccessFromOrders(creator.id, orders)
    : null;
  const profileComplete = hasCompletedCreatorProfile(creator);
  const canUseBusinessFeatures = access?.canUseBusinessFeatures ?? false;
  const canUseIncomeFeatures = access?.canUseIncomeFeatures ?? true;
  const isVerified = access?.isVerified ?? false;
  const notifications =
    creator && (canUseBusinessFeatures || isVerified)
      ? await listNotificationsForCreator(creator.id, locale)
      : [];
  const unreadCount =
    creator && (canUseBusinessFeatures || isVerified)
      ? await countUnreadNotifications(creator.id)
      : 0;
  const income =
    creator && canUseIncomeFeatures ? await getCreatorIncomeSnapshot(creator.id) : null;
  const invitationCounts =
    creator && canUseBusinessFeatures
      ? countInvitationsByTab(await listInvitationsForCreator(creator.id))
      : { pending: 0, accepted: 0, declined: 0, expired: 0 };
  const levelUpSeen = creator ? await hasSeenCertificationLevelUp(creator.id) : true;

  if (creator && isStudioFeaturePath(pathname)) {
    if (access?.isLockedAfterFirstOrder) {
      redirect(withLocale(studioCertificationRedirectPath(locale), locale));
    }
    if (isVerified && !profileComplete && levelUpSeen) {
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
      certificationPaid={isVerified}
      profileComplete={profileComplete}
      canUseBusinessFeatures={canUseBusinessFeatures}
      canUseIncomeFeatures={canUseIncomeFeatures}
      isVerified={isVerified}
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
