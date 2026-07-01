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

export function isVisibleBrandDraftProject(project: Pick<StoredProject, "status" | "settings_json">) {
  if (normalizeCampaignStatus(project.status) !== "draft") {
    return true;
  }
  return !isWizardEphemeralProject(project);
}
