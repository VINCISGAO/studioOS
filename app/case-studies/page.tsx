import { redirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

export default async function CaseStudiesPage({ searchParams }: { searchParams: Promise<SearchParams & { play?: string }> }) {
  const params = await searchParams;
  const locale = getLocale(params);
  const play = typeof params.play === "string" ? `?play=${encodeURIComponent(params.play)}` : "";
  redirect(withLocale(`/cases${play}`, locale));
}
