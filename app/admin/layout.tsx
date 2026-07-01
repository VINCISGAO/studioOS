import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { AdminPortalShell } from "@/components/studioos/admin-portal-shell";
import { getSessionUser } from "@/features/auth/session.service";
import { isPrismaAdminRole } from "@/lib/auth/route-access";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { getLocale, withLocale } from "@/lib/i18n";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/admin";
  const search = headerList.get("x-search") ?? "";
  const locale = getLocale({ lang: new URLSearchParams(search).get("lang") ?? undefined });
  const returnPath = `${pathname}${search ? `?${search}` : ""}`;

  if (pathname === "/admin/login") {
    return children;
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(withLocale(`/admin/login?next=${encodeURIComponent(returnPath)}`, locale));
  }

  if (!isPrismaAdminRole(user.role)) {
    const cookieStore = await cookies();
    cookieStore.delete(DEMO_SESSION_COOKIE);
    redirect(withLocale(`/admin/login?next=${encodeURIComponent(returnPath)}&error=admin-required`, locale));
  }

  return (
    <AdminPortalShell locale={locale} pathname={pathname} search={search}>
      {children}
    </AdminPortalShell>
  );
}
