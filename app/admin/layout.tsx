import { redirect } from "next/navigation";
import { AdminPortalShell } from "@/components/studioos/admin-portal-shell";
import { AdminCsrfProvider } from "@/components/studioos/admin-csrf-provider";
import { validateAdminSession } from "@/features/admin/auth/admin-auth.service";
import { clearAdminSessionCookie, readAdminSessionToken } from "@/features/admin/auth/admin-session-server";
import { buildAdminCsrfToken } from "@/lib/auth/admin-csrf";
import { getLocale, withLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerList = await (await import("next/headers")).headers();
  const pathname = headerList.get("x-pathname") ?? "/admin";
  const search = headerList.get("x-search") ?? "";
  const locale = getLocale({ lang: new URLSearchParams(search).get("lang") ?? undefined });
  const returnPath = `${pathname}${search ? `?${search}` : ""}`;

  if (pathname === "/admin/login" || pathname === "/admin/setup-totp") {
    return children;
  }

  const profile = await validateAdminSession();
  if (!profile) {
    await clearAdminSessionCookie();
    redirect(withLocale(`/admin/login?next=${encodeURIComponent(returnPath)}`, locale));
  }

  const sessionToken = await readAdminSessionToken();
  const adminCsrfToken = sessionToken ? buildAdminCsrfToken(sessionToken) : "";

  return (
    <AdminCsrfProvider token={adminCsrfToken}>
      <AdminPortalShell locale={locale} pathname={pathname} search={search}>
        {children}
      </AdminPortalShell>
    </AdminCsrfProvider>
  );
}
