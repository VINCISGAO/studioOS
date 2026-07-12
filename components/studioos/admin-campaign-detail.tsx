import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminCampaignRelationshipStrip } from "@/components/studioos/admin-campaign-relationship-strip";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminCampaignDetail } from "@/features/admin/campaign/admin-campaign.types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { adminFields } from "@/lib/studioos/admin-copy";
import { adminSettlementStateLabel, adminEscrowStatusLabel, adminDeliveryStatusLabel, adminLedgerEntryTypeLabel, adminLedgerDirectionLabel, adminReviewStatusLabel, adminVersionStatusLabel } from "@/lib/studioos/admin-enum-labels";
import { adminActivityLabel } from "@/lib/studioos/admin-i18n";
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
    openDisputes: "Open disputes",
    noEscrow: "No escrow record.",
    noSettlement: "No settlement preview available.",
    noDelivery: "No delivery record.",
    noWallet: "No wallet for creator.",
    noVersions: "No versions.",
    noComments: "No comments.",
    noLedger: "No ledger entries.",
    noActivity: "No activity.",
    noNotifications: "No notifications."
  },
  zh: {
    back: "返回活动列表",
    info: "活动信息",
    versions: "版本",
    comments: "审片评论",
    delivery: "交付",
    escrow: "托管",
    settlement: "结算预览",
    wallet: "创作者钱包",
    ledger: "账本记录",
    activity: "活动日志",
    notifications: "通知",
    legacyId: "历史项目编号",
    openDisputes: "未结争议",
    noEscrow: "暂无托管记录。",
    noSettlement: "暂无结算预览。",
    noDelivery: "暂无交付记录。",
    noWallet: "创作者暂无钱包。",
    noVersions: "暂无版本。",
    noComments: "暂无评论。",
    noLedger: "暂无账本记录。",
    noActivity: "暂无活动记录。",
    noNotifications: "暂无通知。"
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
  detail,
  embedded = false
}: {
  locale: Locale;
  detail: AdminCampaignDetail;
  embedded?: boolean;
}) {
  const t = copy[locale];
  const f = adminFields(locale);

  return (
    <div className="space-y-6">
      {!embedded ? (
        <Button asChild variant="outline" size="sm">
          <Link href={withLocale(adminPortalRoutes.campaigns, locale)}>
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Link>
        </Button>
      ) : null}

      <AdminCampaignRelationshipStrip locale={locale} detail={detail} />

      {!embedded ? (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{detail.title}</h1>
            <StatusBadge status={detail.status} locale={locale} />
            <Badge variant={detail.settlementState === "DISPUTE" ? "destructive" : "outline"}>
              {adminSettlementStateLabel(detail.settlementState, locale)}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-zinc-500">{detail.id}</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={detail.status} locale={locale} />
          <Badge variant={detail.settlementState === "DISPUTE" ? "destructive" : "outline"}>
            {adminSettlementStateLabel(detail.settlementState, locale)}
          </Badge>
        </div>
      )}

      <Section title={t.info}>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-zinc-500">{f.brand}</dt>
            <dd>{detail.brand.name ?? detail.brand.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">{f.creator}</dt>
            <dd>{detail.creator?.name ?? detail.creator?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">{f.budget}</dt>
            <dd>{formatCurrency(detail.budget, locale)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">{t.legacyId}</dt>
            <dd className="font-mono text-sm">{detail.legacyProjectId ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">{f.reviewRound}</dt>
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
            <div><dt className="text-xs text-zinc-500">{f.status}</dt><dd>{adminEscrowStatusLabel(detail.escrow.status, locale)}</dd></div>
            <div><dt className="text-xs text-zinc-500">{f.amount}</dt><dd>{formatCurrency(detail.escrow.amount, locale)}</dd></div>
            <div><dt className="text-xs text-zinc-500">{f.remaining}</dt><dd>{formatCurrency(detail.escrow.remainingAmount, locale)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">{t.noEscrow}</p>
        )}
      </Section>

      <Section title={t.settlement}>
        {detail.settlementPreview ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs text-zinc-500">{f.order}</dt><dd>{formatCurrency(detail.settlementPreview.orderAmount, locale)}</dd></div>
            <div><dt className="text-xs text-zinc-500">{f.creatorPayout}</dt><dd>{formatCurrency(detail.settlementPreview.creatorPayoutAmount, locale)}</dd></div>
            <div><dt className="text-xs text-zinc-500">{f.commission}</dt><dd>{formatCurrency(detail.settlementPreview.creatorCommissionAmount, locale)}</dd></div>
            <div><dt className="text-xs text-zinc-500">{f.platformRevenue}</dt><dd>{formatCurrency(detail.settlementPreview.platformTotalRevenue, locale)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">{t.noSettlement}</p>
        )}
      </Section>

      <Section title={t.delivery}>
        {detail.delivery ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs text-zinc-500">{f.status}</dt><dd>{adminDeliveryStatusLabel(detail.delivery.status, locale)}</dd></div>
            <div><dt className="text-xs text-zinc-500">{f.delivered}</dt><dd>{formatDate(detail.delivery.deliveredAt, locale)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">{t.noDelivery}</p>
        )}
      </Section>

      <Section title={t.wallet}>
        {detail.wallet ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs text-zinc-500">{f.available}</dt><dd>{formatCurrency(detail.wallet.availableBalance, locale)}</dd></div>
            <div><dt className="text-xs text-zinc-500">{f.pending}</dt><dd>{formatCurrency(detail.wallet.pendingBalance, locale)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">{t.noWallet}</p>
        )}
      </Section>

      <Section title={t.versions}>
        {detail.versions.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>v#</TableHead>
                <TableHead>{f.status}</TableHead>
                <TableHead>{f.review}</TableHead>
                <TableHead>{f.file}</TableHead>
                <TableHead>{f.created}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.versions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.versionNumber}</TableCell>
                  <TableCell>{adminVersionStatusLabel(v.status, locale)}</TableCell>
                  <TableCell>{adminReviewStatusLabel(v.reviewStatus, locale)}</TableCell>
                  <TableCell className="max-w-xs truncate">{v.fileName ?? "—"}</TableCell>
                  <TableCell>{formatDate(v.createdAt, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-zinc-500">{t.noVersions}</p>
        )}
      </Section>

      <Section title={t.comments}>
        {detail.comments.length ? (
          <div className="space-y-3">
            {detail.comments.map((c) => (
              <div key={c.id} className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>v{c.versionNumber} · {c.userEmail ?? "—"}</span>
                  <span>{formatDate(c.createdAt, locale)}</span>
                </div>
                <p className="mt-2">{c.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">{t.noComments}</p>
        )}
      </Section>

      <Section title={t.ledger}>
        {detail.ledgerEntries.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{f.type}</TableHead>
                <TableHead>{f.direction}</TableHead>
                <TableHead>{f.amount}</TableHead>
                <TableHead>{f.description}</TableHead>
                <TableHead>{f.time}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.ledgerEntries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{adminLedgerEntryTypeLabel(e.entryType, locale)}</TableCell>
                  <TableCell>{adminLedgerDirectionLabel(e.direction, locale)}</TableCell>
                  <TableCell>{e.amount} {e.assetCode}</TableCell>
                  <TableCell className="max-w-xs truncate">{e.description ?? "—"}</TableCell>
                  <TableCell>{formatDate(e.createdAt, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-zinc-500">{t.noLedger}</p>
        )}
      </Section>

      <Section title={t.activity}>
        {detail.activityLogs.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{f.time}</TableHead>
                <TableHead>{f.user}</TableHead>
                <TableHead>{f.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.activityLogs.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{formatDate(a.createdAt, locale)}</TableCell>
                  <TableCell>{a.userEmail ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{adminActivityLabel(a.action, locale)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-zinc-500">{t.noActivity}</p>
        )}
      </Section>

      <Section title={t.notifications}>
        {detail.notifications.length ? (
          <div className="space-y-3">
            {detail.notifications.map((n) => (
              <div key={n.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{n.title}</span>
                  {!n.isSent && <Badge variant="warning">{f.unsent}</Badge>}
                </div>
                <p className="mt-1 text-zinc-600">{n.content}</p>
                <p className="mt-2 text-xs text-zinc-500">{formatDate(n.createdAt, locale)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">{t.noNotifications}</p>
        )}
      </Section>
    </div>
  );
}
