import { permanentRedirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<SearchParams & { submitted?: string; error?: string }> };

export default async function LegacyCreatorOnboardingRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = getLocale(params);
  const query = new URLSearchParams();
  if (typeof params.submitted === "string") query.set("submitted", params.submitted);
  if (typeof params.error === "string") query.set("error", params.error);
  if (typeof params.lang === "string") query.set("lang", params.lang);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  permanentRedirect(withLocale(`/studio/onboarding${suffix}`, locale));
}
