import { redirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

type WorksPageProps = {
  searchParams: Promise<SearchParams & { play?: string }>;
};

/** Legacy route — showcase gallery lives at /creators. */
export default async function WorksPage({ searchParams }: WorksPageProps) {
  const params = await searchParams;
  const locale = getLocale(params);
  const play = typeof params.play === "string" ? params.play : undefined;
  const target = play ? withLocale(`/creators?play=${encodeURIComponent(play)}`, locale) : withLocale("/creators", locale);
  redirect(target);
}
