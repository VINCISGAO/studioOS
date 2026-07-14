import { permanentRedirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function LegacyProjectDetailRedirectPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  permanentRedirect(withLocale(`/brand/projects/${id}`, locale));
}
