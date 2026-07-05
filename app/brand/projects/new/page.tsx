import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { BrandCampaignWizard } from "@/components/studioos/brand-campaign-wizard";
import { resolveBrandBriefClientEmail } from "@/lib/client-session";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession } from "@/lib/demo-auth";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getOrCreateEphemeralWizardProject } from "@/lib/brand-start-brief";
import { getProject } from "@/lib/project-service";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
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
  const locale = getLocale(query);
  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);

  if (!session || session.role !== "client") {
    const next = encodeURIComponent(
      withLocale(
        `/brand/projects/new${query.project ? `?project=${query.project}&step=${query.step ?? 1}` : "?step=1"}`,
        locale
      )
    );
    redirect(withLocale(`/login?role=brand&next=${next}`, locale));
  }

  const clientEmail = (await resolveBrandBriefClientEmail()) ?? session.email.toLowerCase();

  if (!clientEmail) {
    redirect(withLocale("/login?role=brand&next=/brand/projects/new", locale));
  }

  const projectId =
    typeof query.project === "string"
      ? query.project
      : Array.isArray(query.project)
        ? (query.project[0] ?? "")
        : "";

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

  const requestedStep = Number(query.step) || 1;
  const step = clampBrandVisibleStep(
    requestedStep || migrateLegacyBrandWizardStep(project.wizard_step || 1)
  );

  return (
    <BrandCampaignWizard
      locale={locale}
      initialData={{ project, assets: [], references: [], brief: null, pack: [] }}
      initialStep={step}
    />
  );
}
