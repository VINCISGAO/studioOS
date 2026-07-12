import { getAppUiLocale } from "@/lib/app-language";
import { AdminSettingsUsersPanel } from "@/components/studioos/admin-settings-users-panel";
import { AdminSecurityPanel } from "@/components/studioos/admin-security-panel";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { getAdminSessionProfile } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams } from "@/lib/i18n";

const copy = {
  en: {
    title: "Settings",
    subtitle: "Platform configuration and admin accounts."
  },
  zh: {
    title: "系统设置",
    subtitle: "平台配置与管理员账号。"
  }
} as const;

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const profile = await getAdminSessionProfile();

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle} narrow>
      <div className="space-y-8">
        <AdminSecurityPanel locale={locale} />
        <AdminSettingsUsersPanel locale={locale} isMaster={profile?.isMaster === true} />
      </div>
    </AdminPageShell>
  );
}
