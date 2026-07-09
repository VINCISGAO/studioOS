import { toSafeNextPath, toSafeNextPathname } from "@/lib/auth/post-login-redirect";
import { appPath } from "@/lib/i18n";
import { getCurrentSession } from "@/lib/session-user";
import type { DemoSession } from "@/lib/demo-session";

export const BRAND_WIZARD_ENTRY_PATH = "/brand/projects/new";

type BrandWizardTargetOptions = {
  projectId?: string;
  step?: string | number;
};

export function buildBrandWizardTargetPath(options?: BrandWizardTargetOptions) {
  const params = new URLSearchParams();
  if (options?.projectId) {
    params.set("project", options.projectId);
  }
  params.set("step", String(options?.step ?? 1));
  const query = params.toString();
  return query ? `${BRAND_WIZARD_ENTRY_PATH}?${query}` : BRAND_WIZARD_ENTRY_PATH;
}

export function buildBrandWizardLoginRedirect(targetPath?: string) {
  const target = targetPath ?? buildBrandWizardTargetPath({ step: 1 });
  const safeTarget = toSafeNextPath(target) || toSafeNextPathname(target) || buildBrandWizardTargetPath({ step: 1 });
  return appPath(`/login?role=brand&next=${encodeURIComponent(safeTarget)}`);
}

export async function requireBrandWizardSession(): Promise<DemoSession | null> {
  const session = await getCurrentSession();
  if (!session || session.role !== "client") {
    return null;
  }
  return session;
}
