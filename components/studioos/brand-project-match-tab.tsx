import { BrandAiMatchReportCard } from "@/components/studioos/brand-ai-match-report-card";
import { BrandInvitationStatusPanel } from "@/components/studioos/brand-invitation-status-panel";
import { BrandMatchRecommendationPanel } from "@/components/studioos/brand-match-recommendation-panel";
import { BrandProjectMatchBoard } from "@/components/studioos/brand-project-match-board";
import type { Locale } from "@/lib/i18n";
import { buildAiMatchReport, type AiMatchReportStatistics } from "@/lib/studioos/ai-match-report";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";

export function BrandProjectMatchTab({
  locale,
  projectId,
  invitations,
  accepted,
  selectedCreatorId = null,
  notificationCount = 0,
  projectBudgetRange,
  aiMatchStatistics
}: {
  locale: Locale;
  projectId: string;
  invitations: StoredCreatorInvitation[];
  accepted: StoredCreatorInvitation[];
  selectedCreatorId?: string | null;
  notificationCount?: number;
  projectBudgetRange?: string | null;
  aiMatchStatistics?: AiMatchReportStatistics | null;
}) {
  const matchReport = buildAiMatchReport({
    invitations,
    projectBudgetRange,
    locale,
    statistics: aiMatchStatistics
  });

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
      <div className="space-y-5">
        <BrandInvitationStatusPanel
          locale={locale}
          projectId={projectId}
          invitations={invitations}
          notificationCount={notificationCount}
          canReroll={!selectedCreatorId}
        />
        {accepted.length > 0 && !selectedCreatorId ? (
          <BrandMatchRecommendationPanel
            locale={locale}
            projectId={projectId}
            accepted={accepted}
            projectBudgetRange={projectBudgetRange}
          />
        ) : null}
        {matchReport ? <BrandAiMatchReportCard locale={locale} report={matchReport} /> : null}
      </div>
      <BrandProjectMatchBoard
        locale={locale}
        projectId={projectId}
        invitations={invitations}
        projectBudgetRange={projectBudgetRange}
        selectionLocked={Boolean(selectedCreatorId)}
      />
    </div>
  );
}
