import { headers } from "next/headers";
import { AdminPortalShell } from "@/components/studioos/admin-portal-shell";
import { getLocale } from "@/lib/i18n";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/admin";
  const search = headerList.get("x-search") ?? "";
  const locale = getLocale({ lang: new URLSearchParams(search).get("lang") ?? undefined });

  return (
    <AdminPortalShell locale={locale} pathname={pathname} search={search}>
      {children}
    </AdminPortalShell>
  );
}
