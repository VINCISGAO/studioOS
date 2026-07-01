"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession, DEMO_USERS } from "@/lib/demo-auth";
import { withLocale, type Locale } from "@/lib/i18n";
import { getProject } from "@/lib/project-service";
import { selectCreatorForProject } from "@/lib/studioos/creator-invitation-store";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

function revalidateClosedLoopPaths(projectId: string) {
  revalidatePath("/brand");
  revalidatePath("/brand/campaigns");
  revalidatePath("/brand/messages");
  revalidatePath(brandPortalRoutes.campaign(projectId));
  revalidatePath(brandPortalRoutes.project(projectId));
  revalidatePath(brandPortalRoutes.projectCheckout(projectId));
  revalidatePath("/studio");
  revalidatePath("/studio/messages");
  revalidatePath("/studio/invitations");
  revalidatePath("/studio/projects");
  revalidatePath(creatorPortalRoutes.projects);
}

export async function selectCreatorFromInvitationsAction(formData: FormData) {
  const locale = (formData.get("lang") as Locale) || "en";
  const projectId = String(formData.get("projectId") ?? "");
  const creatorId = String(formData.get("creatorId") ?? "");

  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  if (!session || session.role !== "client") {
    redirect(withLocale("/login?role=brand", locale));
  }

  const project = await getProject(projectId);
  const demoUser = DEMO_USERS.find((user) => user.email === session.email.toLowerCase());

  const result = await selectCreatorForProject({
    projectId,
    creatorId,
    locale,
    client: {
      client_name: demoUser?.label.replace(/\s*\(brand\)/i, "").trim() ?? session.email.split("@")[0] ?? "Brand",
      client_email: session.email.toLowerCase(),
      company_name: project?.company_name ?? demoUser?.label ?? ""
    }
  });

  revalidateClosedLoopPaths(projectId);

  if (!result.ok) {
    redirect(withLocale(`${brandPortalRoutes.project(projectId)}?tab=match&error=${result.error}`, locale));
  }

  redirect(withLocale(brandPortalRoutes.projectCheckout(projectId), locale));
}
