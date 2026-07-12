import { getAppUiLocale } from "@/lib/app-language";
import { Flag } from "lucide-react";
import { toggleFeatureFlagAction } from "@/app/admin-feature-flag-actions";
import { AdminFormCsrf } from "@/components/studioos/admin-form-csrf";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { featureFlagService } from "@/features/admin/feature-flag.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams } from "@/lib/i18n";
import { adminToggleLabel } from "@/lib/studioos/admin-enum-labels";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to admin",
    eyebrow: "Platform config",
    title: "Feature flags",
    subtitle: "Toggle platform capabilities. Rate limits and monitoring are configured via flag metadata.",
    table: ["Key", "Status", "Metadata", "Updated", "Action"],
    enable: "Enable",
    disable: "Disable",
    empty: "No feature flags seeded. Run npm run db:seed."
  },
  zh: {
    back: "返回管理后台",
    eyebrow: "平台配置",
    title: "功能开关",
    subtitle: "切换平台能力。速率限制与监控通过开关元数据配置。",
    table: ["键", "状态", "元数据", "更新时间", "操作"],
    enable: "启用",
    disable: "禁用",
    empty: "尚未初始化功能开关，请运行 npm run db:seed。"
  }
};

export default async function AdminFeatureFlagsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const flags = user ? await featureFlagService.list(user) : [];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <div className="border-b p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Flag className="h-5 w-5" />
              {t.title}
            </h2>
          </div>
          {flags.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {t.table.map((heading) => (
                    <TableHead key={heading}>{heading}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell className="font-mono text-sm">{flag.key}</TableCell>
                    <TableCell>
                      <Badge variant={flag.enabled ? "success" : "outline"}>
                        {adminToggleLabel(flag.enabled, locale)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                      {flag.metadata ? JSON.stringify(flag.metadata) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(flag.updatedAt, locale)}</TableCell>
                    <TableCell>
                      <form action={toggleFeatureFlagAction}>
                        <AdminFormCsrf />
                        <input type="hidden" name="lang" value={locale} />
                        <input type="hidden" name="key" value={flag.key} />
                        <input type="hidden" name="enabled" value={String(!flag.enabled)} />
                        <Button type="submit" size="sm" variant="outline">
                          {flag.enabled ? t.disable : t.enable}
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">{t.empty}</p>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
