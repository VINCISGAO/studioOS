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
import { getAppUiLocale } from "@/lib/app-language";
import { appPath } from "@/lib/i18n";
import { listOrdersForCreator } from "@/lib/order-service";
import { listNotificationsForCreator } from "@/lib/notification-service";
import { countInvitationsByTab, listInvitationsForCreator } from "@/lib/studioos/creator-invitation-store";
import { ensureCreatorAssignmentNotificationsForOrders } from "@/lib/studioos/creator-assignment-notify";
import { enforceBrandPaymentDeadlinesForCreator } from "@/lib/studioos/brand-payment-expiry.service";
import {
  isStudioFeaturePath,
  studioCertificationRedirectPath,
  studioProfileOnboardingPath
} from "@/lib/studioos/studio-access";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/studio";
  const search = headerList.get("x-search") ?? "";
  const locale = await getAppUiLocale();
  const creator = await getCurrentCreator();
  if (creator) {
    await enforceBrandPaymentDeadlinesForCreator(creator.id);
  }
  const orders = creator ? await listOrdersForCreator(creator.id) : [];
  const access = creator
    ? await resolveCreatorCertificationAccessFromOrders(creator.id, orders)
    : null;
  const profileComplete = hasCompletedCreatorProfile(creator);
  const canUseBusinessFeatures = access?.canUseBusinessFeatures ?? false;
  const isVerified = access?.isVerified ?? false;
  const invitations =
    creator && canUseBusinessFeatures
      ? await listInvitationsForCreator(creator.id, locale)
      : [];
  if (creator && (canUseBusinessFeatures || isVerified)) {
    await ensureCreatorAssignmentNotificationsForOrders({
      creatorId: creator.id,
      orders,
      locale
    });
  }
  const notifications =
    creator && (canUseBusinessFeatures || isVerified)
      ? await listNotificationsForCreator(creator.id, locale)
      : [];
  const unreadCount = notifications.filter((item) => !item.read_at).length;
  const invitationCounts = creator && canUseBusinessFeatures
    ? countInvitationsByTab(invitations)
    : { pending: 0, accepted: 0, declined: 0, expired: 0 };
  const levelUpSeen = creator ? await hasSeenCertificationLevelUp(creator.id) : true;

  if (creator && isStudioFeaturePath(pathname)) {
    if (access?.isLockedAfterFirstOrder) {
      redirect(appPath(studioCertificationRedirectPath(locale)));
    }
    if (isVerified && !profileComplete && levelUpSeen) {
      redirect(appPath(studioProfileOnboardingPath(locale)));
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
      isVerified={isVerified}
      levelUpSeen={levelUpSeen}
      notifications={notifications}
      unreadCount={unreadCount}
      pendingInvitationCount={invitationCounts.pending}
    >
      {children}
    </StudioPortalShell>
  );
}
