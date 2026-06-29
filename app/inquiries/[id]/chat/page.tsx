import { redirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

/** Legacy route → Proposal Room */
export default async function InquiryChatRedirect({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const locale = getLocale(await searchParams);
  redirect(withLocale(`/proposal/${id}`, locale));
}
