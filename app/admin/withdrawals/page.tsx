import { getAppUiLocale } from "@/lib/app-language";
import { AdminWithdrawalQueue } from "@/components/studioos/admin-withdrawal-queue";
import { adminWithdrawalService } from "@/features/admin/withdrawal/admin-withdrawal.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams } from "@/lib/i18n";

const copy = {
  en: {
    title: "Withdrawal queue",
    subtitle: "Approve or reject pending WITHDRAW_REQUEST transactions from Prisma."
  },
  zh: {
    title: "提现审核",
    subtitle: "审核 Prisma 中待处理的 WITHDRAW_REQUEST 交易。"
  }
};

export default async function AdminWithdrawalsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const items = user ? await adminWithdrawalService.listPending(user) : [];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
      <div className="mt-8">
        <AdminWithdrawalQueue locale={locale} items={items} />
      </div>
    </div>
  );
}
