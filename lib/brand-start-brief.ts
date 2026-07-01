import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import {
  resolveBrandBriefEmailFromCookieValues,
  resolveBrandBriefStartFromRequestCookies
} from "@/lib/brand-brief-session";
import { DEMO_SESSION_COOKIE, VISITOR_COOKIE } from "@/lib/auth-config";
import { DEMO_USERS } from "@/lib/demo-auth";
import { createProjectDraft, deleteProjectForClient, listProjectsForClient } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";
import { isWizardEphemeralProject } from "@/lib/studioos/brand-wizard-session";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";

export {
  brandDraftEmailForSession,
  resolveBrandBriefEmailFromCookieValues,
  resolveBrandBriefStartFromRequestCookies
} from "@/lib/brand-brief-session";

export async function resolveBrandBriefClientEmailForStart() {
  const cookieStore = await cookies();
  return resolveBrandBriefEmailFromCookieValues(
    cookieStore.get(DEMO_SESSION_COOKIE)?.value,
    cookieStore.get(VISITOR_COOKIE)?.value
  );
}

export async function ensureBrandBriefClientEmail(): Promise<{
  email: string;
  visitorId?: string;
}> {
  const existing = await resolveBrandBriefClientEmailForStart();
  if (existing) {
    return { email: existing };
  }

  const visitorId = `vis_${Date.now()}_${randomBytes(4).toString("hex")}`;
  return { email: `${visitorId}@visitor.studioos.local`, visitorId };
}

export async function createBrandBriefDraftProjectForEmail(
  clientEmail: string,
  options?: { ephemeral?: boolean }
) {
  const demoUser = DEMO_USERS.find((user) => user.email === clientEmail.toLowerCase());

  const project = await createProjectDraft({
    client_email: clientEmail,
    client_name: demoUser?.label ?? clientEmail.split("@")[0],
    company_name: demoUser?.label ?? clientEmail.split("@")[0],
    created_by: clientEmail,
    wizard_ephemeral: options?.ephemeral ?? true
  });

  return project;
}

/** Reuse in-progress wizard session — do not spawn a new list row on every entry. */
export async function getOrCreateEphemeralWizardProject(clientEmail: string): Promise<StoredProject> {
  const normalized = clientEmail.toLowerCase();
  const projects = await listProjectsForClient(normalized);
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

  if (ephemeral.length > 0) {
    const [keep, ...duplicates] = ephemeral;
    await Promise.all(
      duplicates.map(async (project) => {
        await deleteProjectForClient(project.id, normalized);
      })
    );
    return keep;
  }

  return createBrandBriefDraftProjectForEmail(normalized, { ephemeral: true });
}

export async function createBrandBriefDraftProject() {
  const { email: clientEmail, visitorId } = await ensureBrandBriefClientEmail();
  const project = await getOrCreateEphemeralWizardProject(clientEmail);
  return { project, visitorId };
}
