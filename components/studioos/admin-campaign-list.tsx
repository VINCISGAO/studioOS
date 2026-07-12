"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminCampaignListItem } from "@/features/admin/campaign/admin-campaign.types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { adminCountLabel } from "@/lib/studioos/admin-copy";
import { adminSettlementStateLabel } from "@/lib/studioos/admin-enum-labels";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    search: "Search title or ID",
    status: "Status",
    brand: "Brand search",
    creator: "Creator search",
    escrow: "Escrow status",
    delivery: "Delivery status",
    settlement: "Settlement",
    reviewRound: "Review round",
    filter: "Filter",
    empty: "No campaigns match your filters.",
    table: ["Campaign", "Brand", "Creator", "Status", "Escrow", "Delivery", "Settlement", "Round", "Budget", "Updated"]
  },
  zh: {
    search: "搜索标题或编号",
    status: "状态",
    brand: "品牌方搜索",
    creator: "创作者搜索",
    escrow: "托管状态",
    delivery: "交付状态",
    settlement: "结算",
    reviewRound: "审片轮次",
    filter: "筛选",
    empty: "没有符合条件的活动。",
    table: ["活动", "品牌方", "创作者", "状态", "托管", "交付", "结算", "轮次", "预算", "更新"]
  }
};

function settlementVariant(state: string) {
  if (state === "READY") return "success" as const;
  if (state === "DISPUTE") return "destructive" as const;
  if (state === "RELEASED" || state === "COMPLETED") return "outline" as const;
  return "warning" as const;
}

export function AdminCampaignList({
  locale,
  items,
  total,
  filters
}: {
  locale: Locale;
  items: AdminCampaignListItem[];
  total: number;
  filters: Record<string, string | undefined>;
}) {
  const t = copy[locale];

  return (
    <div>
      <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input type="hidden" name="lang" value={locale} />
        <Input name="search" defaultValue={filters.search} placeholder={t.search} />
        <Input name="status" defaultValue={filters.status} placeholder={t.status} />
        <Input name="brand" defaultValue={filters.brand} placeholder={t.brand} />
        <Input name="creator" defaultValue={filters.creator} placeholder={t.creator} />
        <Input name="escrow" defaultValue={filters.escrow} placeholder={t.escrow} />
        <Input name="delivery" defaultValue={filters.delivery} placeholder={t.delivery} />
        <Input name="settlement" defaultValue={filters.settlement} placeholder={t.settlement} />
        <Input name="round" defaultValue={filters.round} placeholder={t.reviewRound} />
        <Button type="submit" className="sm:col-span-2 lg:col-span-1">
          {t.filter}
        </Button>
      </form>

      <p className="mt-4 text-sm text-zinc-500">{adminCountLabel(locale, total, "campaigns", "个活动")}</p>

      <Card className="mt-4 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          {items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {t.table.map((heading) => (
                    <TableHead key={heading}>{heading}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={withLocale(adminPortalRoutes.campaignDetail(row.id), locale)}
                        className="hover:underline"
                      >
                        {row.title}
                      </Link>
                      <div className="text-xs text-zinc-500">{row.id.slice(0, 8)}</div>
                    </TableCell>
                    <TableCell>
                      <div>{row.brandName ?? "—"}</div>
                      <div className="text-xs text-zinc-500">{row.brandEmail ?? ""}</div>
                    </TableCell>
                    <TableCell>{row.creatorName ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} locale={locale} />
                    </TableCell>
                    <TableCell>{row.escrowStatus ?? "—"}</TableCell>
                    <TableCell>{row.deliveryStatus ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={settlementVariant(row.settlementState)}>
                        {adminSettlementStateLabel(row.settlementState, locale)}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.reviewRound}</TableCell>
                    <TableCell>{formatCurrency(row.budget, locale)}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(row.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-sm text-zinc-500">{t.empty}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
