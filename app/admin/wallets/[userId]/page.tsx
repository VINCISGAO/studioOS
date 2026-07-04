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
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminWalletDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { userId } = await params;
  const locale = getLocale(await searchParams);
  const user = await getAdminSessionUser();
  if (!user) notFound();

  let detail;
  try {
    detail = await adminWalletService.getDetail(user, userId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href={withLocale(adminPortalRoutes.wallets, locale)}>
          <ArrowLeft className="h-4 w-4" /> {locale === "zh" ? "返回" : "Back"}
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-semibold">{detail.name ?? detail.email}</h1>
        <p className="text-sm text-zinc-500">{detail.email}</p>
      </div>

      {detail.wallet && (
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">Legacy wallet</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><dt className="text-xs text-zinc-500">Available</dt><dd>{formatCurrency(detail.wallet.availableBalance)}</dd></div>
              <div><dt className="text-xs text-zinc-500">Pending</dt><dd>{formatCurrency(detail.wallet.pendingBalance)}</dd></div>
            </dl>
          </CardContent>
        </Card>
      )}

      {detail.walletAccount && (
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-0">
            <div className="border-b p-4 font-semibold">WalletAccount assets</div>
            <Table>
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
          <h2 className="font-semibold">{locale === "zh" ? "手动调整" : "Manual adjustment"}</h2>
          <form action={adjustWalletAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <AdminFormCsrf />
            <input type="hidden" name="lang" value={locale} />
            <input type="hidden" name="user_id" value={userId} />
            <Input name="asset_code" defaultValue="USD" placeholder="Asset code" />
            <Input name="amount" type="number" step="0.01" required placeholder="Amount" />
            <select name="direction" className="rounded-md border px-3 py-2 text-sm">
              <option value="CREDIT">CREDIT</option>
              <option value="DEBIT">DEBIT</option>
            </select>
            <Input name="description" required placeholder="Description" />
            <Button type="submit" className="sm:col-span-2">{locale === "zh" ? "提交调整" : "Apply adjustment"}</Button>
          </form>
        </CardContent>
      </Card>

      {detail.walletAccount?.entries.length ? (
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-0">
            <div className="border-b p-4 font-semibold">Recent ledger entries</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.walletAccount.entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell><Badge variant="outline">{e.entryType}</Badge></TableCell>
                    <TableCell>{e.amount} {e.assetCode}</TableCell>
                    <TableCell>{e.description ?? "—"}</TableCell>
                    <TableCell>{formatDate(e.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
