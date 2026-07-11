import { redirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

type CreatorsPageProps = {
  searchParams: Promise<SearchParams & { play?: string }>;
};

export default async function CreatorsPage({ searchParams }: CreatorsPageProps) {
  const params = await searchParams;
  const locale = getLocale(params);
  const play = typeof params.play === "string" ? `?play=${encodeURIComponent(params.play)}` : "";
  redirect(withLocale(`/cases${play}`, locale));
}
