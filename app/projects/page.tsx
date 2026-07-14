import { permanentRedirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

type Props = { searchParams: Promise<SearchParams> };

export default async function LegacyProjectsRedirectPage({ searchParams }: Props) {
  const locale = getLocale(await searchParams);
  permanentRedirect(withLocale("/brand/projects", locale));
}
