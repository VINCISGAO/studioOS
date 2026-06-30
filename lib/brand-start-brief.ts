import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import {
  resolveBrandBriefEmailFromCookieValues,
  resolveBrandBriefStartFromRequestCookies
} from "@/lib/brand-brief-session";
import { DEMO_SESSION_COOKIE, VISITOR_COOKIE } from "@/lib/auth-config";
import { DEMO_USERS } from "@/lib/demo-auth";
import { createProjectDraft } from "@/lib/project-service";

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

export async function createBrandBriefDraftProjectForEmail(clientEmail: string) {
  const demoUser = DEMO_USERS.find((user) => user.email === clientEmail.toLowerCase());

  const project = await createProjectDraft({
    client_email: clientEmail,
    client_name: demoUser?.label ?? clientEmail.split("@")[0],
    company_name: demoUser?.label ?? clientEmail.split("@")[0],
    created_by: clientEmail
  });

  return project;
}

export async function createBrandBriefDraftProject() {
  const { email: clientEmail, visitorId } = await ensureBrandBriefClientEmail();
  const project = await createBrandBriefDraftProjectForEmail(clientEmail);
  return { project, visitorId };
}
