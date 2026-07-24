import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppUiLocale } from "@/lib/app-language";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminCreditService } from "@/features/admin/credits/admin-credit.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { withLocale } from "@/lib/i18n";
import { adminUserRoleLabel } from "@/lib/studioos/admin-enum-labels";

const copy = {
  en: {
    title: "Credit wallet detail",
    subtitle: "Inspect balances, reservations, and immutable ledger entries.",
    available: "Available",
    reserved: "Reserved",
    purchased: "Purchased",
    spent: "Spent",
    transactions: "Transactions",
    reservations: "Reservations"
  },
  zh: {
    title: "Token 钱包详情",
    subtitle: "查看余额、冻结与不可篡改的 Token 流水。",
    available: "可用",
    reserved: "冻结",
    purchased: "累计购买",
    spent: "累计消耗",
    transactions: "Token 流水",
    reservations: "冻结记录"
  }
} as const;

export default async function AdminCreditWalletDetailPage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const admin = await getAdminSessionUser();
  const detail = admin ? await adminCreditService.getWalletDetail(admin, userId) : null;
  if (!detail?.user) notFound();

  return (
    <AdminPageShell
      locale={locale}
      title={t.title}
      subtitle={`${detail.user.fullName ?? detail.user.email} · ${adminUserRoleLabel(detail.user.role, locale)}`}
    >
      <div className="mb-4">
        <Link
          href={withLocale(adminPortalRoutes.creditsWallets, locale)}
          className="text-sm text-zinc-500 underline"
        >
          {locale === "zh" ? "返回用户钱包列表" : "Back to wallet list"}
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t.available, value: detail.wallet?.availableCredits ?? 0 },
          { label: t.reserved, value: detail.wallet?.reservedCredits ?? 0 },
          { label: t.purchased, value: detail.wallet?.lifetimePurchased ?? 0 },
          { label: t.spent, value: detail.wallet?.lifetimeSpent ?? 0 }
        ].map((stat) => (
          <Card key={stat.label} className="border-zinc-200/80 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-0">
            <div className="border-b border-zinc-100 px-4 py-3 text-sm font-medium">{t.transactions}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs">{tx.type}</TableCell>
                    <TableCell className="text-xs tabular-nums">{tx.amount}</TableCell>
                    <TableCell className="text-xs tabular-nums">{tx.balanceAfter}</TableCell>
                    <TableCell className="text-xs">{tx.createdAt.toISOString().slice(0, 16).replace("T", " ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-0">
            <div className="border-b border-zinc-100 px-4 py-3 text-sm font-medium">{t.reservations}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Estimated</TableHead>
                  <TableHead>Captured</TableHead>
                  <TableHead>Released</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="text-xs">{reservation.status}</TableCell>
                    <TableCell className="text-xs tabular-nums">{reservation.estimatedCredits}</TableCell>
                    <TableCell className="text-xs tabular-nums">{reservation.capturedCredits}</TableCell>
                    <TableCell className="text-xs tabular-nums">{reservation.releasedCredits}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}
