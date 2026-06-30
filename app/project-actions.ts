"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { getOrCreateVisitorId } from "@/lib/client-session";
import { parseDemoSession, DEMO_USERS } from "@/lib/demo-auth";
import { getCurrentCreator } from "@/lib/creator-session";
import { withLocale, type Locale } from "@/lib/i18n";
import { canUseStudioFeatures } from "@/lib/studioos/deposit-guard";
import { createProjectApplication, getProject } from "@/lib/project-service";
import { setupBrandCheckout } from "@/lib/studioos/brand-checkout-service";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

async function resolveBrandClient(lang: Locale, companyName?: string) {
  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);

  if (session) {
    const demoUser = DEMO_USERS.find((user) => user.email === session.email.toLowerCase());
    return {
      client_name: demoUser?.label ?? session.email.split("@")[0],
      client_email: session.email.toLowerCase(),
      company_name: companyName ?? demoUser?.label ?? ""
    };
  }

  return {
    client_name: lang === "zh" ? "访客品牌方" : "Guest brand",
    client_email: `${await getOrCreateVisitorId()}@visitor.studioos.local`,
    company_name: companyName ?? ""
  };
}

export async function connectCreatorFromMatchAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const creatorId = String(formData.get("creator_id") ?? "");
  const workId = String(formData.get("work_id") ?? "") || null;

  const project = await getProject(projectId);
  if (!project || !creatorId) {
    redirect(withLocale("/start?error=missing-project", lang));
  }

  const client = await resolveBrandClient(lang, project.company_name);

  await setupBrandCheckout({
    project,
    creatorId,
    workId,
    client: {
      client_name: client.client_name,
      client_email: client.client_email,
      company_name: project.company_name || client.company_name
    },
    locale: lang
  });

  redirect(withLocale(`/brand/projects/${projectId}/checkout`, lang));
}

export async function applyToProjectAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const creatorId = String(formData.get("creator_id") ?? "");
  const proposal = String(formData.get("proposal") ?? "").trim();
  const timeline = String(formData.get("timeline") ?? "").trim();
  const proposedAmount = Number(formData.get("proposed_amount") ?? 0);

  if (!projectId || !creatorId || !proposal || !timeline || !proposedAmount) {
    redirect(withLocale(`/projects/${projectId}?error=missing-application`, lang));
  }

  const creator = await getCurrentCreator();
  if (!canUseStudioFeatures(creator)) {
    redirect(withLocale("/studio/profile?onboarding=1", lang));
  }

  await createProjectApplication({
    project_id: projectId,
    creator_id: creatorId,
    proposed_amount: proposedAmount,
    timeline,
    proposal
  });

  redirect(withLocale(`/projects/${projectId}?applied=1`, lang));
}
