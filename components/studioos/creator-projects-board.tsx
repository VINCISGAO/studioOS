"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StoredOrder } from "@/lib/order-types";
import type { OrderStatus } from "@/lib/order-types";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  countCreatorOrdersByBucket,
  creatorProjectFilterLabels,
  creatorProjectFilters,
  filterCreatorOrders,
  type CreatorProjectFilter
} from "@/lib/studioos/creator-order-lifecycle";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { ArrowUpRight, FolderKanban } from "lucide-react";

const statusLabels: Record<Locale, Partial<Record<OrderStatus, string>>> = {
  en: {
    in_production: "In production",
    revision: "Revision needed",
    review: "Pending review",
    completed: "Completed",
    waiting_payment: "Awaiting payment",
    cancelled: "Cancelled"
  },
  zh: {
    in_production: "制作中",
    revision: "需修改",
    review: "待审核",
    completed: "已完成",
    waiting_payment: "待付款",
    cancelled: "已关闭"
  }
};

const copy = {
  en: {
    title: "My projects",
    subtitle: "Upload, review, revise, and deliver — all inside each project.",
    empty: "No projects in this stage.",
    open: "Open project"
  },
  zh: {
    title: "我的项目",
    subtitle: "上传、审核、修改、交付 — 都在项目详情里完成。",
    empty: "当前阶段没有项目。",
    open: "进入项目"
  }
};

export function CreatorProjectsBoard({ locale, orders }: { locale: Locale; orders: StoredOrder[] }) {
  const t = copy[locale];
  const labels = creatorProjectFilterLabels[locale];
  const [filter, setFilter] = useState<CreatorProjectFilter>("in_progress");
  const counts = useMemo(() => countCreatorOrdersByBucket(orders), [orders]);
  const filtered = useMemo(() => filterCreatorOrders(orders, filter), [orders, filter]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{t.title}</h1>
        <p className={cn("mt-2 max-w-2xl", portalChrome.body)}>{t.subtitle}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {creatorProjectFilters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              filter === item
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900"
            )}
          >
            {labels[item]}
            <span className="ml-1.5 tabular-nums opacity-70">{counts[item]}</span>
          </button>
        ))}
      </div>

      <section className={cn(portalChrome.card, "overflow-hidden")}>
        {filtered.length ? (
          <ul className="divide-y divide-zinc-100">
            {filtered.map((order) => (
              <li key={order.id}>
                <Link
                  href={withLocale(creatorPortalRoutes.project(order.id), locale)}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-zinc-50/80 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-950">{order.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {order.client_name || order.company_name} · {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-700">{formatCurrency(order.creator_payout)}</span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                      {statusLabels[locale][order.status] ?? order.status}
                    </span>
                    <Button variant="ghost" size="sm" className="rounded-lg text-zinc-700">
                      {t.open}
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
              <FolderKanban className="h-6 w-6" />
            </span>
            <p className={portalChrome.body}>{t.empty}</p>
          </div>
        )}
      </section>
    </div>
  );
}
