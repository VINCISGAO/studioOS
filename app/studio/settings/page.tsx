import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { StudioSettingsPage } from "@/components/studioos/studio-settings-page";
import { getCurrentCreator } from "@/features/auth/session-context";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession } from "@/lib/demo-auth";
import { getCreatorSettingsViewModel } from "@/lib/studioos/creator-settings-service";

export default async function StudioSettingsRoute({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = await getAppUiLocale();
  const creator = await getCurrentCreator();

  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  const sessionEmail = session?.email ?? creator.email;
  const settings = await getCreatorSettingsViewModel(creator.id, creator, sessionEmail);

  return <StudioSettingsPage locale={locale} settings={settings} />;
}
