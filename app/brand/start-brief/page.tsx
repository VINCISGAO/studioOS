import { redirect } from "next/navigation";
import { getOrCreateEphemeralWizardProject } from "@/lib/brand-start-brief";
import { requireBrandPortalClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function BrandStartBriefPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);

  let clientEmail: string;
  try {
    clientEmail = await requireBrandPortalClientEmail();
  } catch {
    redirect(withLocale("/brand?error=start-brief", locale));
  }

  let project;
  try {
    project = await getOrCreateEphemeralWizardProject(clientEmail);
  } catch {
    redirect(withLocale("/brand?error=start-brief", locale));
  }

  redirect(withLocale(`/brand/projects/new?project=${project.id}&step=1`, locale));
}
