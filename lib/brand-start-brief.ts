import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import {
  resolveBrandBriefEmailFromCookieValues
} from "@/lib/brand-brief-session";
import { SESSION_COOKIE_NAME, VISITOR_COOKIE } from "@/lib/auth-config";
import { DEMO_USERS } from "@/lib/demo-auth";
import { createProjectDraft, deleteProjectForClient, listProjectsForClient } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";
import { isWizardEphemeralProject, hasResumableEphemeralWizardContent } from "@/lib/studioos/brand-wizard-session";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";

export {
  brandDraftEmailForSession,
  resolveBrandBriefEmailFromCookieValues,
  resolveBrandBriefStartFromRequestCookies
} from "@/lib/brand-brief-session";

export async function resolveBrandBriefClientEmailForStart() {
  const cookieStore = await cookies();
  return resolveBrandBriefEmailFromCookieValues(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
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
  return { email: `${visitorId}@visitor.vincis.local`, visitorId };
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

function listEphemeralWizardDrafts(projects: StoredProject[]) {
  return projects
    .filter(
      (project) =>
        isWizardEphemeralProject(project) && normalizeCampaignStatus(project.status) === "draft"
    )
    .sort(
      (a, b) =>
        new Date(b.updated_at ?? b.created_at).getTime() -
        new Date(a.updated_at ?? a.created_at).getTime()
    );
}

async function deleteEphemeralWizardDrafts(
  clientEmail: string,
  predicate?: (project: StoredProject) => boolean
) {
  const normalized = clientEmail.toLowerCase();
  const projects = await listProjectsForClient(normalized);
  await Promise.all(
    listEphemeralWizardDrafts(projects)
      .filter((project) => (predicate ? predicate(project) : true))
      .map(async (project) => {
        await deleteProjectForClient(project.id, normalized);
      })
  );
}

/** Reuse in-progress wizard session — only when opening a known project id. */
export async function getOrCreateEphemeralWizardProject(clientEmail: string): Promise<StoredProject> {
  const normalized = clientEmail.toLowerCase();
  const projects = await listProjectsForClient(normalized);
  const ephemeral = listEphemeralWizardDrafts(projects);

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

/** Start a blank wizard — drops empty hidden ephemerals, keeps resumable in-progress drafts. */
export async function createFreshEphemeralWizardProject(clientEmail: string): Promise<StoredProject> {
  const normalized = clientEmail.toLowerCase();
  await deleteEphemeralWizardDrafts(
    normalized,
    (project) => !hasResumableEphemeralWizardContent(project)
  );
  return createBrandBriefDraftProjectForEmail(normalized, { ephemeral: true });
}

export async function createBrandBriefDraftProject() {
  const { email: clientEmail, visitorId } = await ensureBrandBriefClientEmail();
  const project = await getOrCreateEphemeralWizardProject(clientEmail);
  return { project, visitorId };
}
