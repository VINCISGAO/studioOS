import { redirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

export default async function CreatorProfilePage({
  searchParams
}: {
  searchParams: Promise<SearchParams & { publish?: string }>;
}) {
  const params = await searchParams;
  const locale = getLocale(params);
  const query = params.publish === "1" ? "/studio/profile?publish=1" : "/studio/profile";
  redirect(withLocale(query, locale));
}
