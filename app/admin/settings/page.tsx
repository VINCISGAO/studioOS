import { AdminSettingsUsersPanel } from "@/components/studioos/admin-settings-users-panel";
import { AdminSecurityPanel } from "@/components/studioos/admin-security-panel";
import { getAdminSessionProfile } from "@/features/admin/auth/admin-auth.service";
import { getLocale, type SearchParams } from "@/lib/i18n";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const profile = await getAdminSessionProfile();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{locale === "zh" ? "系统设置" : "Settings"}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {locale === "zh" ? "平台配置与管理员账号。" : "Platform configuration and admin accounts."}
        </p>
      </div>

      <AdminSecurityPanel locale={locale} />

      <AdminSettingsUsersPanel locale={locale} isMaster={profile?.isMaster === true} />
    </div>
  );
}
