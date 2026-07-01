import { BrandAcceptedCreatorsPanel } from "@/components/studioos/brand-accepted-creators-panel";
import { BrandInvitationRosterPanel } from "@/components/studioos/brand-invitation-roster-panel";
import { BrandInvitationStatusPanel } from "@/components/studioos/brand-invitation-status-panel";
import type { Locale } from "@/lib/i18n";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";

export function BrandProjectMatchTab({
  locale,
  projectId,
  invitations,
  accepted
}: {
  locale: Locale;
  projectId: string;
  invitations: StoredCreatorInvitation[];
  accepted: StoredCreatorInvitation[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="space-y-6">
        <BrandInvitationStatusPanel locale={locale} invitations={invitations} />
        <BrandAcceptedCreatorsPanel locale={locale} projectId={projectId} accepted={accepted} />
      </div>
      <BrandInvitationRosterPanel locale={locale} invitations={invitations} />
    </div>
  );
}
