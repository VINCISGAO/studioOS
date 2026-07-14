import { redirect } from "next/navigation";
import { AdminPortalShell } from "@/components/studioos/admin-portal-shell";
import { AdminCsrfProvider } from "@/components/studioos/admin-csrf-provider";
import { validateAdminSession } from "@/features/admin/auth/admin-auth.service";
import { adminNotificationService } from "@/features/admin/notification/admin-notification.service";
import { clearAdminSessionCookie, readAdminSessionToken } from "@/features/admin/auth/admin-session-server";
import { buildAdminCsrfToken } from "@/lib/auth/admin-csrf";
import { getAppUiLocale } from "@/lib/app-language";
import { buildAvatarInitials } from "@/lib/studioos/avatar-initials";
import { toSafeNextPathname } from "@/lib/auth/post-login-redirect";
import { logger } from "@/lib/core/logger";

export const dynamic = "force-dynamic";

async function safeFailedNotificationCount(profile: { id: string }) {
  try {
    return await adminNotificationService.countFailed({ id: profile.id, role: "ADMIN" });
  } catch (error) {
    logger.error("admin.layout.count_failed_notifications", {
      service: "AdminLayout",
      error: error instanceof Error ? error.message : String(error)
    });
    return 0;
  }
}

function safeAdminCsrfToken(sessionToken: string | null | undefined) {
  if (!sessionToken) return "";
  try {
    return buildAdminCsrfToken(sessionToken);
  } catch (error) {
    logger.error("admin.layout.csrf_token", {
      service: "AdminLayout",
      error: error instanceof Error ? error.message : String(error)
    });
    return "";
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerList = await (await import("next/headers")).headers();
  const pathname = headerList.get("x-pathname") ?? "/admin";
  const search = headerList.get("x-search") ?? "";
  const locale = await getAppUiLocale();
  const returnPath = toSafeNextPathname(pathname) || pathname;

  if (pathname === "/admin/login" || pathname === "/admin/setup-totp") {
    return children;
  }

  const profile = await validateAdminSession();
  if (!profile) {
    await clearAdminSessionCookie();
    redirect(`/admin/login?next=${encodeURIComponent(returnPath)}`);
  }

  const sessionToken = await readAdminSessionToken();
  const adminCsrfToken = safeAdminCsrfToken(sessionToken);
  const failedNotificationCount = await safeFailedNotificationCount(profile);

  return (
    <AdminCsrfProvider token={adminCsrfToken}>
      <AdminPortalShell
        locale={locale}
        pathname={pathname}
        search={search}
        failedNotificationCount={failedNotificationCount}
        adminAccount={{
          name: profile.fullName,
          email: profile.email,
          initials: buildAvatarInitials(profile.fullName || profile.email)
        }}
      >
        {children}
      </AdminPortalShell>
    </AdminCsrfProvider>
  );
}
