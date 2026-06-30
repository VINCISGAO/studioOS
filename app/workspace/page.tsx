import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getLocale, withLocale } from "@/lib/i18n";
import { getMvpProfile } from "@/lib/mvp/session";

export default async function WorkspaceHomePage() {
  const headerList = await headers();
  const search = headerList.get("x-search") ?? "";
  const locale = getLocale({ lang: new URLSearchParams(search).get("lang") ?? undefined });
  const profile = await getMvpProfile();
  if (!profile) {
    redirect(withLocale("/login", locale));
  }
  if (profile.role === "studio") redirect(withLocale("/studio", locale));
  if (profile.role === "admin") redirect(withLocale("/workspace/admin", locale));
  redirect(withLocale("/brand", locale));
}
