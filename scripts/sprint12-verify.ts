/**
 * Sprint 12 — Campaign Wizard 7-step verification
 * Run: npm run sprint12:verify
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CAMPAIGN_WIZARD_STEP_COUNT,
  CAMPAIGN_WIZARD_STEPS,
  clampWizardStep,
  migrateLegacyBrandWizardStep,
  migrateLegacyProjectWizardStep,
  wizardProgressPercent
} from "../lib/campaign/wizard-steps";

type Check = { name: string; ok: boolean; detail?: string };

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function main() {
  const checks: Check[] = [];

  checks.push({
    name: "wizard.seven_steps",
    ok: CAMPAIGN_WIZARD_STEP_COUNT === 7 && CAMPAIGN_WIZARD_STEPS.length === 7,
    detail: `${CAMPAIGN_WIZARD_STEPS.length} steps`
  });

  checks.push({
    name: "wizard.clamp",
    ok: clampWizardStep(99) === 7 && clampWizardStep(0) === 1,
    detail: "clamp 1-7"
  });

  checks.push({
    name: "wizard.legacy_brand",
    ok: migrateLegacyBrandWizardStep(4) === 7,
    detail: "4-step migration"
  });

  checks.push({
    name: "wizard.legacy_project",
    ok: migrateLegacyProjectWizardStep(6) === 7,
    detail: "6-step migration"
  });

  checks.push({
    name: "wizard.progress",
    ok: wizardProgressPercent(7) === 100,
    detail: "percent calc"
  });

  checks.push({
    name: "wizard.progress_service",
    ok: read("lib/campaign/wizard-progress.service.ts").includes("emitWizardProgress"),
    detail: "emitWizardProgress"
  });

  checks.push({
    name: "wizard.progress_sse",
    ok: read("app/api/projects/[projectId]/wizard/stream/route.ts").includes("WizardProgress"),
    detail: "project SSE"
  });

  checks.push({
    name: "wizard.progress_hook",
    ok: read("hooks/use-wizard-progress.ts").includes("useWizardProgress"),
    detail: "useWizardProgress"
  });

  checks.push({
    name: "wizard.progress_panel",
    ok: read("components/studioos/ui/wizard-progress-panel.tsx").includes("WizardProgressPanel"),
    detail: "WizardProgressPanel"
  });

  checks.push({
    name: "wizard.brand_actions",
    ok:
      read("app/brand-campaign-actions.ts").includes("saveBrandCampaignBriefAction") &&
      read("app/brand-campaign-actions.ts").includes("runAnalyzingProgress"),
    detail: "split actions + progress"
  });

  checks.push({
    name: "wizard.brand_ui",
    ok: read("components/studioos/brand-campaign-wizard.tsx").includes("step === 7"),
    detail: "7 screens"
  });

  checks.push({
    name: "wizard.project_ui",
    ok: read("components/studioos/project-wizard.tsx").includes("step === 7"),
    detail: "7 screens"
  });

  checks.push({
    name: "wizard.brief_step_mode",
    ok: read("components/studioos/brand-campaign-step-brief.tsx").includes('stepMode?: "brief"'),
    detail: "stepMode split"
  });

  checks.push({
    name: "project_service.seven",
    ok: read("lib/project-service.ts").includes("Math.min(7, step + 1)"),
    detail: "wizard max 7"
  });

  const failed = checks.filter((c) => !c.ok);
  for (const check of checks) {
    console.log(`${check.ok ? "✓" : "✗"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }

  if (failed.length) {
    console.error(`\n${failed.length} check(s) failed`);
    process.exit(1);
  }

  console.log(`\nAll ${checks.length} Sprint 12 checks passed.`);
}

main();
