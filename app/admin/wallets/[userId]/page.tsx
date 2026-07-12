import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adjustWalletAction } from "@/app/admin-actions";
import { adminWalletService } from "@/features/admin/wallet/admin-wallet.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { AdminFormCsrf } from "@/components/studioos/admin-form-csrf";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { AdminPageActionLink, AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { adminFields } from "@/lib/studioos/admin-copy";
import { adminLedgerEntryTypeLabel } from "@/lib/studioos/admin-enum-labels";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back",
    legacyWallet: "Legacy wallet",
    walletAssets: "Wallet assets",
    manualAdjustment: "Manual adjustment",
    recentLedger: "Recent ledger entries",
    apply: "Apply adjustment",
    placeholders: {
      assetCode: "Asset code",
      amount: "Amount",
      description: "Description"
    },
    directions: {
      credit: "Credit",
      debit: "Debit"
    },
    assetColumns: ["Asset", "Available", "Pending", "Frozen"]
  },
  zh: {
    back: "返回",
    legacyWallet: "旧版钱包",
    walletAssets: "钱包资产",
    manualAdjustment: "手动调整",
    recentLedger: "最近账本记录",
    apply: "提交调整",
    placeholders: {
      assetCode: "资产代码",
      amount: "金额",
      description: "说明"
    },
    directions: {
      credit: "入账",
      debit: "出账"
    },
    assetColumns: ["资产", "可用", "待入账", "冻结"]
  }
} as const;

export default async function AdminWalletDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { userId } = await params;
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const f = adminFields(locale);
  const user = await getAdminSessionUser();
  if (!user) notFound();

  let detail;
  try {
    detail = await adminWalletService.getDetail(user, userId);
  } catch {
    notFound();
  }

  return (
    <AdminPageShell
      locale={locale}
      title={detail.name ?? detail.email ?? userId}
      subtitle={detail.email}
      narrow
      actions={
        <AdminPageActionLink href={withLocale(adminPortalRoutes.wallets, locale)}>← {t.back}</AdminPageActionLink>
      }
    >
      <div className="space-y-6">
      {detail.wallet && (
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">{t.legacyWallet}</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><dt className="text-xs text-zinc-500">{f.available}</dt><dd>{formatCurrency(detail.wallet.availableBalance, locale)}</dd></div>
              <div><dt className="text-xs text-zinc-500">{f.pending}</dt><dd>{formatCurrency(detail.wallet.pendingBalance, locale)}</dd></div>
            </dl>
          </CardContent>
        </Card>
      )}

      {detail.walletAccount && (
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-0">
            <div className="border-b p-4 font-semibold">{t.walletAssets}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  {t.assetColumns.map((heading) => (
                    <TableHead key={heading}>{heading}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.walletAccount.assets.map((a) => (
                  <TableRow key={a.assetCode}>
                    <TableCell>{a.assetCode}</TableCell>
                    <TableCell>{a.available}</TableCell>
                    <TableCell>{a.pending}</TableCell>
                    <TableCell>{a.frozen}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <h2 className="font-semibold">{t.manualAdjustment}</h2>
          <form action={adjustWalletAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <AdminFormCsrf />
            <input type="hidden" name="lang" value={locale} />
            <input type="hidden" name="user_id" value={userId} />
            <Input name="asset_code" defaultValue="USD" placeholder={t.placeholders.assetCode} />
            <Input name="amount" type="number" step="0.01" required placeholder={t.placeholders.amount} />
            <select name="direction" className="rounded-md border px-3 py-2 text-sm">
              <option value="CREDIT">{t.directions.credit}</option>
              <option value="DEBIT">{t.directions.debit}</option>
            </select>
            <Input name="description" required placeholder={t.placeholders.description} />
            <Button type="submit" className="sm:col-span-2">{t.apply}</Button>
          </form>
        </CardContent>
      </Card>

      {detail.walletAccount?.entries.length ? (
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-0">
            <div className="border-b p-4 font-semibold">{t.recentLedger}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{f.type}</TableHead>
                  <TableHead>{f.amount}</TableHead>
                  <TableHead>{f.description}</TableHead>
                  <TableHead>{f.time}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.walletAccount.entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell><Badge variant="outline">{adminLedgerEntryTypeLabel(e.entryType, locale)}</Badge></TableCell>
                    <TableCell>{e.amount} {e.assetCode}</TableCell>
                    <TableCell>{e.description ?? "—"}</TableCell>
                    <TableCell>{formatDate(e.createdAt, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
      </div>
    </AdminPageShell>
  );
}
