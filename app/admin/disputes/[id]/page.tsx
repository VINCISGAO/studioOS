import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { resolveDisputeAction } from "@/app/admin-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auditService } from "@/features/admin/audit.service";
import { disputeService } from "@/features/admin/dispute.service";
import { getSessionUser } from "@/features/auth/session.service";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
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
    campaign: "Campaign",
    brand: "Brand",
    openedBy: "发起方",
    reason: "原因",
    status: "状态",
    result: "处理结果",
    activity: "Campaign 活动记录",
    resolve: "结案",
    resultPlaceholder: "处理说明",
    notFound: "未找到争议。"
  }
};

export default async function AdminDisputeDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const locale = getLocale(await searchParams);
  const t = copy[locale];
  const user = await getSessionUser();

  if (!user) {
    return <p className="p-6 text-sm text-muted-foreground">{t.notFound}</p>;
  }

  let dispute;
  try {
    dispute = await disputeService.get(user, id);
  } catch {
    return <p className="p-6 text-sm text-muted-foreground">{t.notFound}</p>;
  }

  const activity = await auditService.list(user, { campaignId: dispute.campaignId, limit: 20 });

  return (
    <div>
      <Button asChild variant="outline" size="sm">
        <Link href={withLocale(adminPortalRoutes.disputes, locale)}>
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Link>
      </Button>
      <div className="mt-8">
        <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
      </div>

      <Card className="mt-8 shadow-none">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">{t.campaign}</p>
              <p className="font-medium">{dispute.campaignTitle}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.brand}</p>
              <p className="font-medium">{dispute.brandName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.openedBy}</p>
              <p className="font-medium">{dispute.openedBy}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.status}</p>
              <Badge variant={dispute.status === "OPEN" ? "warning" : "outline"}>{dispute.status}</Badge>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.reason}</p>
            <p className="mt-1 text-sm leading-6">{dispute.reason}</p>
          </div>
          {dispute.result ? (
            <div>
              <p className="text-xs text-muted-foreground">{t.result}</p>
              <p className="mt-1 text-sm">{dispute.result}</p>
            </div>
          ) : null}
          {(dispute.status === "OPEN" || dispute.status === "PROCESSING") && (
            <form action={resolveDisputeAction} className="flex flex-col gap-2 border-t pt-4">
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

      <Card className="mt-8 shadow-none">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold">{t.activity}</h2>
          <ul className="mt-4 space-y-3">
            {activity.map((log) => (
              <li key={log.id} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline">{log.action}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                </div>
                {log.metadata ? (
                  <p className="mt-2 truncate text-xs text-muted-foreground">{JSON.stringify(log.metadata)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
