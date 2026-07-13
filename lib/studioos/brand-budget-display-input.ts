import type { StoredProject } from "@/lib/project-types";

export function readBrandDisplayBudgetInput(project: Pick<StoredProject, "settings_json">): string | null {
  const questionnaire = project.settings_json?.brand_questionnaire;
  if (!questionnaire || typeof questionnaire !== "object" || Array.isArray(questionnaire)) {
    return null;
  }
  const raw = (questionnaire as { displayBudgetInput?: unknown }).displayBudgetInput;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}
