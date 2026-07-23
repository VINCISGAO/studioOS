import { BrandAiMatchReportCard } from "@/components/studioos/brand-ai-match-report-card";
import { BrandProjectDetailTabs, type OverviewDetailTab } from "@/components/studioos/brand-project-detail-tabs";
import { BrandProjectInvitationOverviewCard } from "@/components/studioos/brand-project-invitation-overview-card";
import { BrandProjectMatchBoard } from "@/components/studioos/brand-project-match-board";
import { BrandProjectOverviewHeader } from "@/components/studioos/brand-project-overview-header";
import { BrandProjectOverviewSidebar } from "@/components/studioos/brand-project-overview-sidebar";
import { BrandProjectOverviewStepper } from "@/components/studioos/brand-project-overview-stepper";
import type { Locale } from "@/lib/i18n";
import { buildAiMatchReport, type AiMatchReportStatistics } from "@/lib/studioos/ai-match-report";
import type { BrandCommercialContext, BrandCommercialStep } from "@/lib/studioos/commercial-lifecycle";
import type { ReviewComment } from "@/lib/studioos/review-store";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";

function resolveDetailTab(tab: string | undefined): OverviewDetailTab {
  if (tab === "assets" || tab === "versions" || tab === "audit") return tab;
  return "brief";
}

export function BrandProjectOverview({
  locale,
  project,
  activeTab,
  linkedOrder,
  deliverables,
  reviewComments,
  projectInvitations,
  selectedCreatorId,
  brandCommercialStep,
  commercialContext,
  notificationCount,
  aiMatchStatistics
}: {
  locale: Locale;
  project: StoredProject;
  activeTab: string;
  linkedOrder: StoredOrder | null;
  deliverables: StoredDeliverable[];
  reviewComments: ReviewComment[];
  projectInvitations: StoredCreatorInvitation[];
  selectedCreatorId: string | null;
  brandCommercialStep: BrandCommercialStep;
  commercialContext: BrandCommercialContext;
  notificationCount: number;
  aiMatchStatistics?: AiMatchReportStatistics | null;
}) {
  const detailTab = resolveDetailTab(activeTab);
  const acceptedCount = projectInvitations.filter((item) => item.status === "accepted").length;
  const showInvitationPanels =
    projectInvitations.length > 0 ||
    ["matching", "studio_selected", "production", "in_review"].includes(project.status);

  const matchReport = buildAiMatchReport({
    invitations: projectInvitations,
    projectBudgetRange: project.budget_range,
    locale,
    statistics: aiMatchStatistics
  });

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      <BrandProjectOverviewHeader
        locale={locale}
        project={project}
        brandCommercialStep={brandCommercialStep}
        commercialContext={commercialContext}
      />

      <BrandProjectOverviewStepper
        locale={locale}
        brandCommercialStep={brandCommercialStep}
        commercialContext={commercialContext}
        acceptedCount={acceptedCount}
      />

      {showInvitationPanels ? (
        <>
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <BrandProjectInvitationOverviewCard
              locale={locale}
              projectId={project.id}
              invitations={projectInvitations}
              notificationCount={notificationCount}
            />
            <div id="creator-responses">
              <BrandProjectMatchBoard
                locale={locale}
                projectId={project.id}
                invitations={projectInvitations}
                projectBudgetRange={project.budget_range}
                selectionLocked={Boolean(selectedCreatorId)}
              />
            </div>
          </div>

          {projectInvitations.length > 0 ? (
            <BrandAiMatchReportCard locale={locale} report={matchReport} />
          ) : null}
        </>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <BrandProjectDetailTabs
          locale={locale}
          project={project}
          activeTab={detailTab}
          projectId={project.id}
          linkedOrder={linkedOrder}
          deliverables={deliverables}
          reviewComments={reviewComments}
        />
        <BrandProjectOverviewSidebar
          locale={locale}
          projectId={project.id}
          brandCommercialStep={brandCommercialStep}
          commercialContext={commercialContext}
          hasDeliverables={deliverables.length > 0}
          acceptedCount={acceptedCount}
          selectedCreatorId={selectedCreatorId}
          linkedOrder={linkedOrder}
        />
      </div>
    </div>
  );
}
