import { headers } from "next/headers";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { AiCopilotRoot } from "@/components/ai-copilot/ai-copilot-root";
import { StudioPortalShell } from "@/components/studioos/studio-portal-shell";
import { getCurrentCreator } from "@/features/auth/session-context";
import {
  hasCompletedCreatorProfile
} from "@/lib/studioos/deposit-guard";
import { resolveCreatorCertificationAccessFromOrders } from "@/lib/studioos/creator-certification-access";
import {
  hasSeenCertificationLevelUp
} from "@/lib/studioos/creator-settings-service";
import { getAppUiLocale } from "@/lib/app-language";
import { appPath } from "@/lib/i18n";
import { resolveCreatorPortalGuardRedirect } from "@/lib/studioos/creator-portal-guard";
import { listOrdersForCreator } from "@/lib/order-service";
import { listNotificationsForCreator } from "@/lib/notification-service";
import { countInvitationsByTab, listInvitationsForCreator, syncCreatorInvitationNotifications } from "@/lib/studioos/creator-invitation-store";
import { ensureCreatorAssignmentNotificationsForOrders } from "@/lib/studioos/creator-assignment-notify";
import { enforceBrandPaymentDeadlinesForCreator } from "@/lib/studioos/brand-payment-expiry.service";
import { resolvePendingSelectionCelebration } from "@/lib/studioos/creator-selection-celebration";
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
  const guardRedirect = await resolveCreatorPortalGuardRedirect(locale);
  if (guardRedirect) {
    redirect(guardRedirect);
  }

  const creator = await getCurrentCreator();

  if (creator) {
    after(() => {
      void enforceBrandPaymentDeadlinesForCreator(creator.id);
    });
  }

  const orders = creator ? await listOrdersForCreator(creator.id) : [];
  const [access, levelUpSeen] = await Promise.all([
    creator ? resolveCreatorCertificationAccessFromOrders(creator.id, orders) : Promise.resolve(null),
    creator ? hasSeenCertificationLevelUp(creator.id) : Promise.resolve(true)
  ]);
  const profileComplete = hasCompletedCreatorProfile(creator);
  const canUseBusinessFeatures = access?.canUseBusinessFeatures ?? false;
  const isVerified = access?.isVerified ?? false;

  const [invitations, notifications] = await Promise.all([
    creator && canUseBusinessFeatures
      ? listInvitationsForCreator(creator.id, locale, { syncNotifications: false })
      : Promise.resolve([]),
    creator && (canUseBusinessFeatures || isVerified)
      ? listNotificationsForCreator(creator.id, locale)
      : Promise.resolve([])
  ]);

  if (creator && canUseBusinessFeatures) {
    after(() => {
      void syncCreatorInvitationNotifications(creator.id, invitations, locale);
    });
  }

  if (creator && (canUseBusinessFeatures || isVerified)) {
    after(() => {
      void ensureCreatorAssignmentNotificationsForOrders({
        creatorId: creator.id,
        orders,
        locale
      });
    });
  }

  const unreadCount = notifications.filter((item) => !item.read_at).length;
  const pendingSelectionCelebration =
    creator && (canUseBusinessFeatures || isVerified)
      ? await resolvePendingSelectionCelebration({
          creatorId: creator.id,
          notifications
        })
      : null;
  const invitationCounts = creator && canUseBusinessFeatures
    ? countInvitationsByTab(invitations)
    : { pending: 0, accepted: 0, declined: 0, expired: 0 };

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
      pendingSelectionCelebration={pendingSelectionCelebration}
    >
      {children}
      <AiCopilotRoot />
    </StudioPortalShell>
  );
}
