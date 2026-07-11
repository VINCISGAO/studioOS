import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { CreatorPublicProfileEditor } from "@/components/creator/creator-public-profile-editor";
import { getCurrentCreator } from "@/features/auth/session-context";
import { type SearchParams, withLocale } from "@/lib/i18n";

export default async function StudioProfileRedirectPage({
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

  return <CreatorPublicProfileEditor locale={locale} baseCreator={creator} />;
}
