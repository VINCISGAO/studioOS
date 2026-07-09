import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { type SearchParams, withLocale } from "@/lib/i18n";

export default async function StudioQualityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  redirect(withLocale("/studio/upload", locale));
}
