import { getAppUiLocale } from "@/lib/app-language";
import { Scale } from "lucide-react";
import { resolveDisputeAction } from "@/app/admin-actions";
import { AdminFormCsrf } from "@/components/studioos/admin-form-csrf";
import { AdminPageActionLink, AdminPageShell } from "@/components/studioos/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auditService } from "@/features/admin/audit.service";
import { disputeService } from "@/features/admin/dispute.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { adminFields } from "@/lib/studioos/admin-copy";
import { adminDisputeStatusLabel } from "@/lib/studioos/admin-enum-labels";
import { adminActivityLabel } from "@/lib/studioos/admin-i18n";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to disputes",
    title: "Dispute review",
    campaign: "Campaign",
    brand: "Brand",
    openedBy: "Opened by",
    reason: "Reason",
    status: "Status",
    result: "Resolution",
    activity: "Campaign activity",
    resolve: "Resolve dispute",
    resultPlaceholder: "Resolution summary",
    notFound: "Dispute not found."
  },
  zh: {
    back: "返回争议列表",
    title: "争议审核",
    campaign: "活动",
    brand: "品牌方",
    openedBy: "发起方",
    reason: "原因",
    status: "状态",
    result: "处理结果",
    activity: "活动记录",
    resolve: "结案",
    resultPlaceholder: "处理说明",
    notFound: "未找到争议。"
  }
} as const;

export default async function AdminDisputeDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const f = adminFields(locale);
  const user = await getAdminSessionUser();

  if (!user) {
    return <p className="p-6 text-sm text-zinc-500">{t.notFound}</p>;
  }

  let dispute;
  try {
    dispute = await disputeService.get(user, id);
  } catch {
    return <p className="p-6 text-sm text-zinc-500">{t.notFound}</p>;
  }

  const activity = await auditService.list(user, { campaignId: dispute.campaignId, limit: 20 });

  return (
    <AdminPageShell
      locale={locale}
      title={t.title}
      subtitle={dispute.campaignTitle}
      actions={
        <AdminPageActionLink href={withLocale(adminPortalRoutes.disputes, locale)}>← {t.back}</AdminPageActionLink>
      }
    >
      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-zinc-500">{t.campaign}</p>
              <p className="font-medium">{dispute.campaignTitle}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">{t.brand}</p>
              <p className="font-medium">{dispute.brandName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">{t.openedBy}</p>
              <p className="font-medium">{dispute.openedBy}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">{f.status}</p>
              <Badge variant={dispute.status === "OPEN" ? "warning" : "outline"}>
                {adminDisputeStatusLabel(dispute.status, locale)}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500">{t.reason}</p>
            <p className="mt-1 text-sm leading-6">{dispute.reason}</p>
          </div>
          {dispute.result ? (
            <div>
              <p className="text-xs text-zinc-500">{t.result}</p>
              <p className="mt-1 text-sm">{dispute.result}</p>
            </div>
          ) : null}
          {(dispute.status === "OPEN" || dispute.status === "PROCESSING") && (
            <form action={resolveDisputeAction} className="flex flex-col gap-2 border-t border-zinc-100 pt-4">
              <AdminFormCsrf />
              <input type="hidden" name="lang" value={locale} />
              <input type="hidden" name="dispute_id" value={dispute.id} />
              <input type="hidden" name="status" value="RESOLVED" />
              <input
                name="result"
                required
                placeholder={t.resultPlaceholder}
                className="rounded-md border px-3 py-2 text-sm"
              />
              <Button type="submit" size="sm" variant="outline" className="w-fit">
                <Scale className="h-4 w-4" /> {t.resolve}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold">{t.activity}</h2>
          <ul className="mt-4 space-y-3">
            {activity.map((log) => (
              <li key={log.id} className="rounded-lg border border-zinc-200/80 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline">{adminActivityLabel(log.action, locale)}</Badge>
                  <span className="text-xs text-zinc-500">{formatDate(log.createdAt, locale)}</span>
                </div>
                {log.metadata ? (
                  <p className="mt-2 truncate text-xs text-zinc-500">{JSON.stringify(log.metadata)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
