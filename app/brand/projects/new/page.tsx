import { redirect } from "next/navigation";
import { BrandCampaignWizard } from "@/components/studioos/brand-campaign-wizard";
import {
  getCreativeBrief,
  listAssetsForProject,
  listPackItems,
  listReferencesForProject
} from "@/lib/campaign-store";
import { resolveBrandBriefClientEmail } from "@/lib/client-session";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession } from "@/lib/demo-auth";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { clampBrandVisibleStep, migrateLegacyBrandWizardStep } from "@/lib/campaign/wizard-steps";
import { runBrandWizardDemoPrepareInstant } from "@/lib/campaign/brand-wizard-demo-prepare";
import { getProject } from "@/lib/project-service";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import { cookies } from "next/headers";

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
        `/brand/projects/new${query.project ? `?project=${query.project}&step=${query.step ?? 1}` : ""}`,
        locale
      )
    );
    redirect(withLocale(`/login?role=brand&next=${next}`, locale));
  }

  const clientEmail = (await resolveBrandBriefClientEmail()) ?? session.email.toLowerCase();

  if (!clientEmail) {
    redirect(withLocale("/login?role=brand&next=/brand/start-brief", locale));
  }

  const projectId =
    typeof query.project === "string"
      ? query.project
      : Array.isArray(query.project)
        ? (query.project[0] ?? "")
        : "";

  if (!projectId) {
    redirect(withLocale("/brand", locale));
  }

  let project = await getProject(projectId);
  if (!project || project.client_email !== clientEmail.toLowerCase()) {
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

  const rawStep = Number(query.step) || migrateLegacyBrandWizardStep(project.wizard_step || 1);
  const step = clampBrandVisibleStep(rawStep);

  if (step >= 2 && !project.wizard_completed_steps.includes(5)) {
    try {
      await runBrandWizardDemoPrepareInstant(projectId, locale);
      project = (await getProject(projectId)) ?? project;
    } catch {
      // Wizard still renders — user can go back and resubmit step 1
    }
  }

  const [assets, references, brief, pack] = await Promise.all([
    listAssetsForProject(projectId),
    listReferencesForProject(projectId),
    getCreativeBrief(projectId),
    listPackItems(projectId)
  ]);

  const initialData = { project, assets, references, brief, pack };

  return (
    <BrandCampaignWizard locale={locale} initialData={initialData} initialStep={step} />
  );
}
