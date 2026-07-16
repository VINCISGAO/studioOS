"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE, VISITOR_COOKIE } from "@/lib/auth-config";
import { resolveBrandBriefStartFromRequestCookies } from "@/lib/brand-brief-session";
import { createFreshEphemeralWizardProject } from "@/lib/brand-start-brief";
import { appPath } from "@/lib/i18n";

/** Creates a draft campaign and opens the brand wizard. */
export async function startBrandBriefAction(_formData: FormData) {
  const cookieStore = await cookies();
  const { email: clientEmail, visitorId } = resolveBrandBriefStartFromRequestCookies(
    cookieStore.get(DEMO_SESSION_COOKIE)?.value,
    cookieStore.get(VISITOR_COOKIE)?.value
  );

  if (visitorId) {
    cookieStore.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }

  let project;
  try {
    project = await createFreshEphemeralWizardProject(clientEmail);
  } catch {
    redirect(appPath("/brand?error=draft-failed"));
  }

  redirect(appPath(`/brand/projects/new?project=${project.id}&step=1`));
}
