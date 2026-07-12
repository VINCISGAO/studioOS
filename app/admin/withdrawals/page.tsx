import { getAppUiLocale } from "@/lib/app-language";
import { AdminWithdrawalQueue } from "@/components/studioos/admin-withdrawal-queue";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminWithdrawalService } from "@/features/admin/withdrawal/admin-withdrawal.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams } from "@/lib/i18n";

const copy = {
  en: {
    title: "Withdrawal queue",
    subtitle: "Approve or reject pending withdrawal requests."
  },
  zh: {
    title: "提现审核",
    subtitle: "审核待处理的提现申请。"
  }
} as const;

export default async function AdminWithdrawalsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const items = user ? await adminWithdrawalService.listPending(user) : [];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <AdminWithdrawalQueue locale={locale} items={items} />
    </AdminPageShell>
  );
}
