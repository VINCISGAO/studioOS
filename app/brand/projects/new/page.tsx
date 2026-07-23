import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { BrandCampaignWizard } from "@/components/studioos/brand-campaign-wizard";
import { resolveBrandBriefClientEmail } from "@/features/auth/session-context";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { getOrCreateEphemeralWizardProject } from "@/lib/brand-start-brief";
import {
  assertBrandCampaignCreationAllowed
} from "@/lib/studioos/brand-active-campaign.server";
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

  const creationGate = await assertBrandCampaignCreationAllowed(clientEmail, locale);
  if (!creationGate.ok) {
    if (creationGate.gate === "rate_limit") {
      const code = creationGate.rateLimitCode === "rate_limit_10m" ? "10m" : "24h";
      redirect(withLocale(`/brand?error=campaign-rate-limit&code=${code}`, locale));
    }
    redirect(withLocale(`/brand?error=campaign-limit`, locale));
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

  const hasExplicitStep = query.step !== undefined;
  const urlStep = Number(requestedStep);
  const fromServer = migrateLegacyBrandWizardStep(project.wizard_step || 1);
  const hasConfirmedDirection =
    typeof project.settings_json?.selected_direction_id === "string" &&
    project.settings_json.selected_direction_id.trim().length > 0;
  const step = clampBrandVisibleStep(
    hasExplicitStep && Number.isFinite(urlStep) && urlStep > 0
      ? urlStep
      : !hasConfirmedDirection && fromServer >= 3
        ? 2
        : fromServer
  );

  return (
    <BrandCampaignWizard
      locale={locale}
      initialData={{ project, assets: [], references: [], brief: null, pack: [] }}
      initialStep={step}
    />
  );
}
