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

/** Pick the latest in-progress wizard draft from an already-loaded project list (no extra DB round-trip). */
export function pickLatestEphemeralWizardProject(projects: StoredProject[]): StoredProject | null {
  const ephemeral = projects
    .filter(
      (project) =>
        isWizardEphemeralProject(project) && normalizeCampaignStatus(project.status) === "draft"
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
