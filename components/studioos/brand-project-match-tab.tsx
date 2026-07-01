import { BrandInvitationStatusPanel } from "@/components/studioos/brand-invitation-status-panel";
import { BrandMatchRecommendationPanel } from "@/components/studioos/brand-match-recommendation-panel";
import { BrandProjectMatchBoard } from "@/components/studioos/brand-project-match-board";
import type { Locale } from "@/lib/i18n";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";

export function BrandProjectMatchTab({
  locale,
  projectId,
  invitations,
  accepted,
  notificationCount = 0,
  projectBudgetRange
}: {
  locale: Locale;
  projectId: string;
  invitations: StoredCreatorInvitation[];
  accepted: StoredCreatorInvitation[];
  notificationCount?: number;
  projectBudgetRange?: string | null;
}) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
      <div className="space-y-5">
        <BrandInvitationStatusPanel
          locale={locale}
          invitations={invitations}
          notificationCount={notificationCount}
        />
        {accepted.length > 0 ? (
          <BrandMatchRecommendationPanel
            locale={locale}
            projectId={projectId}
            accepted={accepted}
            projectBudgetRange={projectBudgetRange}
          />
        ) : null}
      </div>
      <BrandProjectMatchBoard
        locale={locale}
        projectId={projectId}
        invitations={invitations}
        projectBudgetRange={projectBudgetRange}
      />
    </div>
  );
}
