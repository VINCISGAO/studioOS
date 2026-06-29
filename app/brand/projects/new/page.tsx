import { redirect } from "next/navigation";
import { BrandCampaignWizard } from "@/components/studioos/brand-campaign-wizard";
import {
  getCreativeBrief,
  listAssetsForProject,
  listPackItems,
  listReferencesForProject
} from "@/lib/campaign-store";
import { resolveBrandBriefClientEmail, getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getProject } from "@/lib/project-service";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";

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
  const clientEmail = (await resolveBrandBriefClientEmail()) ?? (await getCurrentClientEmail());

  if (!clientEmail) {
    redirect(withLocale("/login?role=brand&next=/brand", locale));
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

  const project = await getProject(projectId);
  if (!project || project.client_email !== clientEmail.toLowerCase()) {
    redirect(withLocale(`/brand?error=wizard-access`, locale));
  }

  const status = normalizeCampaignStatus(project.status);
  if (status !== "draft") {
    if (status === "matching") {
      redirect(withLocale(`/brand/projects/${projectId}/studios`, locale));
    }
    redirect(withLocale(`/brand/projects/${projectId}`, locale));
  }

  const [assets, references, brief, pack] = await Promise.all([
    listAssetsForProject(projectId),
    listReferencesForProject(projectId),
    getCreativeBrief(projectId),
    listPackItems(projectId)
  ]);

  const initialData = { project, assets, references, brief, pack };
  const rawStep = Number(query.step) || project.wizard_step || 1;
  const step = Math.min(7, Math.max(1, rawStep));

  return (
    <BrandCampaignWizard locale={locale} initialData={initialData} initialStep={step} />
  );
}
