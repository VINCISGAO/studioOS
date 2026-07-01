import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminCampaignDetail } from "@/features/admin/campaign/admin-campaign.types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to campaigns",
    info: "Campaign info",
    versions: "Versions",
    comments: "Review comments",
    delivery: "Delivery",
    escrow: "Escrow",
    settlement: "Settlement preview",
    wallet: "Creator wallet",
    ledger: "Ledger entries",
    activity: "Activity log",
    notifications: "Notifications",
    legacyId: "Legacy project ID",
    openDisputes: "Open disputes"
  },
  zh: {
    back: "返回 Campaign 列表",
    info: "Campaign 信息",
    versions: "版本",
    comments: "审片评论",
    delivery: "交付",
    escrow: "托管",
    settlement: "结算预览",
    wallet: "Creator 钱包",
    ledger: "账本记录",
    activity: "活动日志",
    notifications: "通知",
    legacyId: "Legacy 项目 ID",
    openDisputes: "未结争议"
  }
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-zinc-200/80 shadow-none">
      <CardContent className="p-0">
        <div className="border-b p-4">
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <div className="p-4">{children}</div>
      </CardContent>
    </Card>
  );
}

export function AdminCampaignDetailView({
  locale,
  detail
}: {
  locale: Locale;
  detail: AdminCampaignDetail;
}) {
  const t = copy[locale];

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href={withLocale(adminPortalRoutes.campaigns, locale)}>
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Link>
      </Button>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{detail.title}</h1>
          <Badge variant="outline">{detail.status}</Badge>
          <Badge variant={detail.settlementState === "DISPUTE" ? "destructive" : "outline"}>
            {detail.settlementState}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-zinc-500">{detail.id}</p>
      </div>

      <Section title={t.info}>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-zinc-500">Brand</dt>
            <dd>{detail.brand.name ?? detail.brand.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Creator</dt>
            <dd>{detail.creator?.name ?? detail.creator?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Budget</dt>
            <dd>{formatCurrency(detail.budget)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">{t.legacyId}</dt>
            <dd className="font-mono text-sm">{detail.legacyProjectId ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Review round</dt>
            <dd>{detail.reviewRound}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">{t.openDisputes}</dt>
            <dd>{detail.openDisputes}</dd>
          </div>
        </dl>
      </Section>

      <Section title={t.escrow}>
        {detail.escrow ? (
          <dl className="grid gap-3 sm:grid-cols-3">
            <div><dt className="text-xs text-zinc-500">Status</dt><dd>{detail.escrow.status}</dd></div>
            <div><dt className="text-xs text-zinc-500">Amount</dt><dd>{formatCurrency(detail.escrow.amount)}</dd></div>
            <div><dt className="text-xs text-zinc-500">Remaining</dt><dd>{formatCurrency(detail.escrow.remainingAmount)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">No escrow record.</p>
        )}
      </Section>

      <Section title={t.settlement}>
        {detail.settlementPreview ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs text-zinc-500">Order</dt><dd>{formatCurrency(detail.settlementPreview.orderAmount)}</dd></div>
            <div><dt className="text-xs text-zinc-500">Creator payout</dt><dd>{formatCurrency(detail.settlementPreview.creatorPayoutAmount)}</dd></div>
            <div><dt className="text-xs text-zinc-500">Commission</dt><dd>{formatCurrency(detail.settlementPreview.creatorCommissionAmount)}</dd></div>
            <div><dt className="text-xs text-zinc-500">Platform revenue</dt><dd>{formatCurrency(detail.settlementPreview.platformTotalRevenue)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">No settlement preview available.</p>
        )}
      </Section>

      <Section title={t.delivery}>
        {detail.delivery ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs text-zinc-500">Status</dt><dd>{detail.delivery.status}</dd></div>
            <div><dt className="text-xs text-zinc-500">Delivered</dt><dd>{formatDate(detail.delivery.deliveredAt)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">No delivery record.</p>
        )}
      </Section>

      <Section title={t.wallet}>
        {detail.wallet ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs text-zinc-500">Available</dt><dd>{formatCurrency(detail.wallet.availableBalance)}</dd></div>
            <div><dt className="text-xs text-zinc-500">Pending</dt><dd>{formatCurrency(detail.wallet.pendingBalance)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">No wallet for creator.</p>
        )}
      </Section>

      <Section title={t.versions}>
        {detail.versions.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>v#</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.versions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.versionNumber}</TableCell>
                  <TableCell>{v.status}</TableCell>
                  <TableCell>{v.reviewStatus}</TableCell>
                  <TableCell className="max-w-xs truncate">{v.fileName ?? "—"}</TableCell>
                  <TableCell>{formatDate(v.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-zinc-500">No versions.</p>
        )}
      </Section>

      <Section title={t.comments}>
        {detail.comments.length ? (
          <div className="space-y-3">
            {detail.comments.map((c) => (
              <div key={c.id} className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>v{c.versionNumber} · {c.userEmail ?? "—"}</span>
                  <span>{formatDate(c.createdAt)}</span>
                </div>
                <p className="mt-2">{c.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No comments.</p>
        )}
      </Section>

      <Section title={t.ledger}>
        {detail.ledgerEntries.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.ledgerEntries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.entryType}</TableCell>
                  <TableCell>{e.direction}</TableCell>
                  <TableCell>{e.amount} {e.assetCode}</TableCell>
                  <TableCell className="max-w-xs truncate">{e.description ?? "—"}</TableCell>
                  <TableCell>{formatDate(e.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-zinc-500">No ledger entries.</p>
        )}
      </Section>

      <Section title={t.activity}>
        {detail.activityLogs.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.activityLogs.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{formatDate(a.createdAt)}</TableCell>
                  <TableCell>{a.userEmail ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{a.action}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-zinc-500">No activity.</p>
        )}
      </Section>

      <Section title={t.notifications}>
        {detail.notifications.length ? (
          <div className="space-y-3">
            {detail.notifications.map((n) => (
              <div key={n.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{n.title}</span>
                  {!n.isSent && <Badge variant="warning">unsent</Badge>}
                </div>
                <p className="mt-1 text-zinc-600">{n.content}</p>
                <p className="mt-2 text-xs text-zinc-500">{formatDate(n.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No notifications.</p>
        )}
      </Section>
    </div>
  );
}
