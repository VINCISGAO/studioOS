import { redirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

/** Legacy route — Delivery Workspace lives at /studio/delivery */
export default async function StudioUploadRedirectPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const locale = getLocale(query);
  const params = new URLSearchParams();
  params.set("lang", locale);
  for (const [key, value] of Object.entries(query)) {
    if (key === "lang" || value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.set(key, value);
    }
  }
  redirect(`/studio/delivery?${params.toString()}`);
}
