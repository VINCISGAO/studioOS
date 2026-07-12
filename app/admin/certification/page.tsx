import { getAppUiLocale } from "@/lib/app-language";
import { FileCheck2 } from "lucide-react";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminCertificationService } from "@/features/admin/certification/admin-certification.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to admin",
    eyebrow: "Certification records",
    title: "Certified partner onboarding forms",
    subtitle: "Forms generated after deposit confirmation and delivered to creator message center.",
    table: ["Studio", "Form ID", "Status", "Issued", "Profile submitted", "Fields"],
    issued: "Issued",
    completed: "Profile completed"
  },
  zh: {
    back: "返回管理后台",
    eyebrow: "认证记录",
    title: "认证服务商入驻表单",
    subtitle: "保证金确认后自动生成，并同步发送至创作者消息中心。",
    table: ["创作者", "表单编号", "状态", "生成时间", "主页提交", "字段数"],
    issued: "已生成",
    completed: "主页已完善"
  }
};

export default async function AdminCertificationPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const forms = user ? await adminCertificationService.list(user) : [];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {t.table.map((heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.length ? (
                forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div className="font-medium">{form.creatorName}</div>
                      <div className="text-xs text-muted-foreground">{form.creatorId}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{form.formId}</TableCell>
                    <TableCell>
                      <Badge variant={form.status === "profile_completed" ? "success" : "secondary"}>
                        {form.status === "profile_completed" ? t.completed : t.issued}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(form.issuedAt, locale)}</TableCell>
                    <TableCell>{form.submittedAt ? formatDate(form.submittedAt, locale) : "—"}</TableCell>
                    <TableCell>{form.fieldCount}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    {locale === "zh" ? "暂无认证入驻表单记录。" : "No certification onboarding forms yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <FileCheck2 className="h-4 w-4" />
        {locale === "zh" ? `共 ${forms.length} 条记录` : `${forms.length} records`}
      </div>
    </AdminPageShell>
  );
}
