import { redirect } from "next/navigation";
import { CreatorPublicProfileEditor } from "@/components/creator/creator-public-profile-editor";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

export default async function StudioProfileRedirectPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = getLocale(params);
  const creator = await getCurrentCreator();

  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  return <CreatorPublicProfileEditor locale={locale} baseCreator={creator} />;
}
