"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE, VISITOR_COOKIE } from "@/lib/auth-config";
import { resolveBrandBriefStartFromRequestCookies } from "@/lib/brand-brief-session";
import { getOrCreateEphemeralWizardProject } from "@/lib/brand-start-brief";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

function localeFromForm(formData: FormData) {
  return getLocale({ lang: String(formData.get("lang") ?? "") } satisfies SearchParams);
}

/** Creates a draft campaign and opens the brand wizard. */
export async function startBrandBriefAction(formData: FormData) {
  const locale = localeFromForm(formData);
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
    project = await getOrCreateEphemeralWizardProject(clientEmail);
  } catch {
    redirect(withLocale("/brand?error=draft-failed", locale));
  }

  redirect(withLocale(`/brand/projects/new?project=${project.id}&step=1`, locale));
}
