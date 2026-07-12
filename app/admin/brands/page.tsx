import { getAppUiLocale } from "@/lib/app-language";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminBrandService } from "@/features/admin/brand/admin-brand.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams } from "@/lib/i18n";
import { adminFields } from "@/lib/studioos/admin-copy";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    title: "Brands",
    subtitle: "All brand accounts and campaigns.",
    empty: "No brand accounts yet.",
    campaigns: "Campaigns",
    created: "Created"
  },
  zh: {
    title: "品牌方",
    subtitle: "所有品牌方账户与活动。",
    empty: "暂无品牌方账户。",
    campaigns: "活动数",
    created: "创建时间"
  }
} as const;

export default async function AdminBrandsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const f = adminFields(locale);
  const user = await getAdminSessionUser();
  const brands = user ? await adminBrandService.list(user) : [];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{f.brand}</TableHead>
                <TableHead>{f.industry}</TableHead>
                <TableHead>{t.campaigns}</TableHead>
                <TableHead>{f.status}</TableHead>
                <TableHead>{t.created}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.length ? (
                brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div className="font-medium">{brand.companyName}</div>
                      <div className="text-xs text-zinc-500">{brand.email}</div>
                    </TableCell>
                    <TableCell>{brand.industry ?? "—"}</TableCell>
                    <TableCell>{brand.campaignCount}</TableCell>
                    <TableCell>{brand.status}</TableCell>
                    <TableCell>{formatDate(brand.createdAt)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-zinc-500">
                    {t.empty}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
