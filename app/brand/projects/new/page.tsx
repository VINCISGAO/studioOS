import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { BrandCampaignWizard } from "@/components/studioos/brand-campaign-wizard";
import { resolveBrandBriefClientEmail } from "@/lib/client-session";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { getOrCreateEphemeralWizardProject } from "@/lib/brand-start-brief";
import { getProject } from "@/lib/project-service";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import {
  buildBrandWizardLoginRedirect,
  buildBrandWizardTargetPath,
  requireBrandWizardSession
} from "@/lib/studioos/brand-wizard-entry";
import {
  clampBrandVisibleStep,
  migrateLegacyBrandWizardStep
} from "@/lib/campaign/wizard-steps";

type NewProjectSearchParams = SearchParams & {
  project?: string;
  step?: string;
};

export const dynamic = "force-dynamic";

export default async function NewProjectPage({
  searchParams
}: {
  searchParams: Promise<NewProjectSearchParams>;
}) {
  const query = await searchParams;
  const locale = await getAppUiLocale();
  const session = await requireBrandWizardSession();

  const projectId =
    typeof query.project === "string"
      ? query.project
      : Array.isArray(query.project)
        ? (query.project[0] ?? "")
        : "";
  const requestedStep = typeof query.step === "string" ? query.step : Array.isArray(query.step) ? (query.step[0] ?? "1") : "1";

  if (!session) {
    redirect(
      buildBrandWizardLoginRedirect(
        buildBrandWizardTargetPath({
          projectId: projectId || undefined,
          step: requestedStep
        })
      )
    );
  }

  const clientEmail = (await resolveBrandBriefClientEmail()) ?? session.email.toLowerCase();

  if (!clientEmail) {
    redirect(buildBrandWizardLoginRedirect());
  }

  if (!projectId) {
    const project = await getOrCreateEphemeralWizardProject(clientEmail);
    redirect(withLocale(`/brand/projects/new?project=${project.id}&step=1`, locale));
  }

  const project = await getProject(projectId);
  if (!project) {
    const fallbackProject = await getOrCreateEphemeralWizardProject(clientEmail);
    redirect(withLocale(`/brand/projects/new?project=${fallbackProject.id}&step=1`, locale));
  }
  if (project.client_email !== clientEmail.toLowerCase()) {
    redirect(withLocale(`/brand?error=wizard-access`, locale));
  }

  const status = normalizeCampaignStatus(project.status);
  if (status !== "draft") {
    if (status === "matching") {
      redirect(withLocale(`/brand/projects/${projectId}/studios`, locale));
    }
    if (status === "payment_pending") {
      redirect(withLocale(`/brand/projects/${projectId}/checkout`, locale));
    }
    redirect(withLocale(`/brand/projects/${projectId}`, locale));
  }

  const step = clampBrandVisibleStep(
    Number(requestedStep) || migrateLegacyBrandWizardStep(project.wizard_step || 1)
  );

  return (
    <BrandCampaignWizard
      locale={locale}
      initialData={{ project, assets: [], references: [], brief: null, pack: [] }}
      initialStep={step}
    />
  );
}
