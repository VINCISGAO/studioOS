import { BrandAiMatchReportCard } from "@/components/studioos/brand-ai-match-report-card";
import {
  BrandInvitationStatsPanel,
  BrandInvitationStatusPanel
} from "@/components/studioos/brand-invitation-status-panel";
import { BrandMatchRecommendationPanel } from "@/components/studioos/brand-match-recommendation-panel";
import { BrandProjectMatchBoard } from "@/components/studioos/brand-project-match-board";
import type { Locale } from "@/lib/i18n";
import { buildAiMatchReport, type AiMatchReportStatistics } from "@/lib/studioos/ai-match-report";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import type { BrandRecommendedCreator } from "@/lib/studioos/brand-match-recommendation-types";

export function BrandProjectMatchTab({
  locale,
  projectId,
  invitations,
  selectedCreatorId = null,
  notificationCount = 0,
  projectBudgetRange,
  aiMatchStatistics,
  recommendedCreators
}: {
  locale: Locale;
  projectId: string;
  invitations: StoredCreatorInvitation[];
  accepted: StoredCreatorInvitation[];
  selectedCreatorId?: string | null;
  notificationCount?: number;
  projectBudgetRange?: string | null;
  aiMatchStatistics?: AiMatchReportStatistics | null;
  recommendedCreators: BrandRecommendedCreator[];
}) {
  const matchReport = buildAiMatchReport({
    invitations,
    projectBudgetRange,
    locale,
    statistics: aiMatchStatistics
  });

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
      <div className="space-y-5">
        <BrandInvitationStatusPanel
          locale={locale}
          invitations={invitations}
          selectedCreatorId={selectedCreatorId}
        />
        <BrandAiMatchReportCard locale={locale} report={matchReport} />
        <BrandInvitationStatsPanel
          locale={locale}
          projectId={projectId}
          invitations={invitations}
          notificationCount={notificationCount}
          canReroll={!selectedCreatorId}
        />
      </div>

      <div className="space-y-5">
        <BrandProjectMatchBoard
          locale={locale}
          projectId={projectId}
          invitations={invitations}
          projectBudgetRange={projectBudgetRange}
          selectionLocked={Boolean(selectedCreatorId)}
        />
        <BrandMatchRecommendationPanel
          locale={locale}
          projectId={projectId}
          recommendedCreators={recommendedCreators}
          selectionLocked={Boolean(selectedCreatorId)}
        />
      </div>
    </div>
  );
}
