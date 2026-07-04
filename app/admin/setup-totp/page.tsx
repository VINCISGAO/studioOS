import { AdminSetupTotpShell } from "@/components/studioos/admin-setup-totp-shell";
import { getLocale, type SearchParams } from "@/lib/i18n";

export default async function AdminSetupTotpPage({
  searchParams
}: {
  searchParams: Promise<SearchParams & { token?: string }>;
}) {
  const params = await searchParams;
  const locale = getLocale(params);
  const token = typeof params.token === "string" ? params.token : "";

  return <AdminSetupTotpShell locale={locale} token={token} />;
}
