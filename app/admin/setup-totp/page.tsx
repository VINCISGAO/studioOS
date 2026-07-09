import { getAppUiLocale } from "@/lib/app-language";
import { AdminSetupTotpShell } from "@/components/studioos/admin-setup-totp-shell";
import { type SearchParams } from "@/lib/i18n";

export default async function AdminSetupTotpPage({
  searchParams
}: {
  searchParams: Promise<SearchParams & { token?: string }>;
}) {
  const params = await searchParams;
  const locale = await getAppUiLocale();
  const token = typeof params.token === "string" ? params.token : "";

  return <AdminSetupTotpShell locale={locale} token={token} />;
}
