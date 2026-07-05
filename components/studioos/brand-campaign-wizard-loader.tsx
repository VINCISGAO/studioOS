import { BrandCampaignWizard } from "@/components/studioos/brand-campaign-wizard";
import { listAssetsForProject, listReferencesForProject } from "@/lib/campaign-store";
import { clampBrandVisibleStep, migrateLegacyBrandWizardStep } from "@/lib/campaign/wizard-steps";
import type { Locale } from "@/lib/i18n";
import { getProject } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";

export async function BrandCampaignWizardLoader({
  projectId,
  locale,
  requestedStep,
  project: initialProject
}: {
  projectId: string;
  locale: Locale;
  requestedStep: number;
  project?: StoredProject | null;
}) {
  const project = initialProject ?? (await getProject(projectId));
  if (!project) {
    return null;
  }

  const rawStep = requestedStep || migrateLegacyBrandWizardStep(project.wizard_step || 1);
  const step = clampBrandVisibleStep(rawStep);

  // Step 1 only needs product assets + refs — skip brief/pack/demo-prepare (Step 2 loads AI client-side).
  const [assets, references] = await Promise.all([
    listAssetsForProject(projectId),
    listReferencesForProject(projectId)
  ]);

  return (
    <BrandCampaignWizard
      locale={locale}
      initialData={{ project, assets, references, brief: null, pack: [] }}
      initialStep={step}
    />
  );
}
