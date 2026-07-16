import type { StoredProject } from "@/lib/project-types";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";

export const WIZARD_EPHEMERAL_KEY = "wizard_ephemeral";
export const WIZARD_SAVED_AT_KEY = "wizard_saved_at";

export function isWizardEphemeralProject(project: Pick<StoredProject, "status" | "settings_json">) {
  if (normalizeCampaignStatus(project.status) !== "draft") {
    return false;
  }
  return project.settings_json?.[WIZARD_EPHEMERAL_KEY] === true;
}

/** Pick the latest ephemeral draft that has saved in-progress content. */
export function pickResumableEphemeralWizardProject(projects: StoredProject[]): StoredProject | null {
  const ephemeral = projects
    .filter(
      (project) =>
        isWizardEphemeralProject(project) &&
        normalizeCampaignStatus(project.status) === "draft" &&
        hasResumableEphemeralWizardContent(project)
    )
    .sort(
      (a, b) =>
        new Date(b.updated_at ?? b.created_at).getTime() -
        new Date(a.updated_at ?? a.created_at).getTime()
    );
  return ephemeral[0] ?? null;
}

export function isVisibleBrandDraftProject(project: Pick<StoredProject, "status" | "settings_json">) {
  if (normalizeCampaignStatus(project.status) !== "draft") {
    return true;
  }
  return !isWizardEphemeralProject(project);
}

/** Ephemeral wizard session has user-entered content worth offering "resume". */
export function hasResumableEphemeralWizardContent(
  project: Pick<
    StoredProject,
    "status" | "settings_json" | "campaign_goal" | "notes" | "product_name" | "wizard_step" | "wizard_completed_steps"
  >
) {
  if (!isWizardEphemeralProject(project)) {
    return false;
  }

  const questionnaire = project.settings_json?.brand_questionnaire as
    | { rawSummary?: string; productDescription?: string; productName?: string }
    | undefined;

  const hasText = Boolean(
    project.campaign_goal?.trim() ||
      project.notes?.trim() ||
      project.product_name?.trim() ||
      questionnaire?.rawSummary?.trim() ||
      questionnaire?.productDescription?.trim() ||
      questionnaire?.productName?.trim()
  );
  const hasProgress =
    (project.wizard_step ?? 1) > 1 || (project.wizard_completed_steps?.length ?? 0) > 0;

  return hasText || hasProgress;
}
