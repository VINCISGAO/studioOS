"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clapperboard,
  FileText,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Star
} from "lucide-react";
import { CreatorAvatar } from "@/components/creator/creator-profile-ui";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { tCertified } from "@/lib/studioos/deposit-copy";
import type { Creator } from "@/lib/types";
import type { StoredOrder } from "@/lib/order-types";
import type { CreatorNotification } from "@/lib/notification-types";
import type { OrderStatus } from "@/lib/order-types";
import { cn, formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    certifiedStudio: "Official certified studio",
    editProfile: "Edit profile",
    assigned: "In production",
    assignedSub: "Active projects",
    inReview: "In review",
    inReviewSub: "Awaiting feedback",
    completed: "Completed",
    completedSub: "Delivered projects",
    revenue: "Total income",
    revenueSub: "Lifetime earnings",
    projects: "Assigned projects",
    sortLatest: "Latest assigned",
    enterStudio: "Enter studio",
    enterProject: "Enter project",
    viewDetails: "View details",
    empty: "No assigned projects yet.",
    brand: "Brand",
    payout: "Income",
    assignedDate: "Assigned",
    totalProjects: (n: number) => `${n} project${n === 1 ? "" : "s"} total`
  },
  zh: {
    certifiedStudio: "官方认证制作台",
    editProfile: "编辑资料",
    assigned: "制作中",
    assignedSub: "项目进行中",
    inReview: "审片中",
    inReviewSub: "等待反馈",
    completed: "已完成",
    completedSub: "已交付项目",
    revenue: "总收入",
    revenueSub: "累计收入",
    projects: "分配项目",
    sortLatest: "最新分配",
    enterStudio: "进入制作台",
    enterProject: "进入项目",
    viewDetails: "查看详情",
    empty: "暂无分配项目。",
    brand: "品牌",
    payout: "收入",
    assignedDate: "分配日期",
    totalProjects: (n: number) => `共 ${n} 个项目`
  }
};

const statusLabels: Record<Locale, Partial<Record<OrderStatus, string>>> = {
  en: {
    in_production: "In production",
    revision: "In production",
    review: "Pending review",
    completed: "Completed",
    waiting_payment: "Awaiting payment"
  },
  zh: {
    in_production: "制作中",
    revision: "制作中",
    review: "待审核",
    completed: "已完成",
    waiting_payment: "待付款"
  }
};

function studioInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function statusPillClass(status: OrderStatus) {
  if (status === "completed") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80";
  }
  if (status === "review" || status === "revision") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80";
  }
  if (status === "in_production" || status === "waiting_payment") {
    return "bg-orange-50 text-orange-700 ring-1 ring-orange-200/80";
  }
  return "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80";
}

function orderStatusLabel(status: OrderStatus, locale: Locale) {
  return statusLabels[locale][status] ?? status;
}

function orderActionLabel(status: OrderStatus, locale: Locale) {
  if (status === "completed" || status === "review") {
    return copy[locale].viewDetails;
  }
  return copy[locale].enterProject;
}

function formatAssignedDate(iso: string, locale: Locale) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function thumbnailGradient(orderId: string) {
  const palettes = [
    "from-slate-700 via-slate-800 to-zinc-900",
    "from-indigo-700 via-violet-800 to-purple-900",
    "from-teal-700 via-cyan-800 to-blue-900",
    "from-rose-700 via-orange-800 to-amber-900"
  ];
  const index = orderId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

function ProjectThumbnail({ order }: { order: StoredOrder }) {
  return (
    <div
      className={cn(
        "relative h-14 w-[88px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br shadow-sm ring-1 ring-black/5",
        thumbnailGradient(order.id)
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_55%)]" />
      <div className="absolute bottom-1.5 left-1.5 rounded bg-black/35 px-1.5 py-0.5 text-[10px] font-medium text-white">
        AD
      </div>
    </div>
  );
}

function OrderStatusPill({ status, locale }: { status: OrderStatus; locale: Locale }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusPillClass(status))}>
      {orderStatusLabel(status, locale)}
    </span>
  );
}

export function StudioWorkspaceDashboard({
  locale,
  creator,
  orders,
  stats
}: {
  locale: Locale;
  creator: Creator;
  orders: StoredOrder[];
  notifications?: CreatorNotification[];
  stats: { assigned: number; inReview: number; completed: number; revenue: number };
}) {
  const t = copy[locale];
  const certified = creator.deposit_status === "paid";
  const primaryOrder = orders.find((o) => !["completed", "cancelled"].includes(o.status)) ?? orders[0];

  const statCards = [
    {
      label: t.assigned,
      sub: t.assignedSub,
      value: stats.assigned,
      icon: Clapperboard,
      iconClass: "text-indigo-600 bg-indigo-50"
    },
    {
      label: t.inReview,
      sub: t.inReviewSub,
      value: stats.inReview,
      icon: FileText,
      iconClass: "text-violet-600 bg-violet-50"
    },
    {
      label: t.completed,
      sub: t.completedSub,
      value: stats.completed,
      icon: CheckCircle2,
      iconClass: "text-emerald-600 bg-emerald-50"
    },
    {
      label: t.revenue,
      sub: t.revenueSub,
      value: formatCurrency(stats.revenue),
      icon: CircleDollarSign,
      iconClass: "text-sky-600 bg-sky-50"
    }
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/40 to-indigo-50/50 shadow-sm">
        <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <CreatorAvatar initials={studioInitials(creator.name)} avatarUrl={creator.avatar_url} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">{creator.name}</h1>
                {certified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {t.certifiedStudio}
                  </span>
                ) : null}
              </div>
              {creator.headline ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{creator.headline}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 ring-1 ring-zinc-200/60 backdrop-blur-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-zinc-900">{creator.rating}</span>
                </span>
                {creator.country ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-zinc-600 ring-1 ring-zinc-200/60 backdrop-blur-sm">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    {creator.country}
                  </span>
                ) : null}
                {certified ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200/80">
                    {tCertified(locale).profileBadge}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            <Link href={withLocale("/studio/profile", locale)}>
              <Pencil className="h-4 w-4" />
              {t.editProfile}
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, sub, value, icon: Icon, iconClass }) => (
          <div
            key={label}
            className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-zinc-500">{label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{value}</p>
                <p className="mt-1 text-xs text-zinc-400">{sub}</p>
              </div>
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconClass)}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="text-lg font-semibold text-zinc-950">{t.projects}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600"
            >
              {t.sortLatest}
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            </button>
            {primaryOrder ? (
              <Button asChild className="h-10 rounded-xl bg-indigo-600 px-4 hover:bg-indigo-700">
                <Link href={withLocale(creatorPortalRoutes.project(primaryOrder.id), locale)}>
                  <Plus className="h-4 w-4" />
                  {t.enterStudio}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        {orders.length ? (
          <>
            <ul className="divide-y divide-zinc-100">
              {orders.map((order) => (
                <li key={order.id} className="group px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <ProjectThumbnail order={order} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium text-zinc-900">
                            {order.title || order.company_name}
                          </p>
                          <OrderStatusPill status={order.status} locale={locale} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                          <span>
                            {t.brand}: {order.company_name || order.client_name}
                          </span>
                          <span>
                            {t.payout}: {formatCurrency(order.creator_payout)}
                          </span>
                          <span>
                            {t.assignedDate}: {formatAssignedDate(order.created_at, locale)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-zinc-200 bg-white"
                      >
                        <Link href={withLocale(creatorPortalRoutes.review(order.id), locale)} className="gap-2">
                          <Clapperboard className="h-4 w-4" />
                          {locale === "zh" ? "审片" : "Review"}
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-zinc-200 bg-white"
                      >
                        <Link href={withLocale(creatorPortalRoutes.project(order.id), locale)} className="gap-2">
                          {orderActionLabel(order.status, locale)}
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </Link>
                      </Button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
                        aria-label="More"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-zinc-100 px-5 py-3 sm:px-6">
              <p className="text-sm text-zinc-400">{t.totalProjects(orders.length)}</p>
            </div>
          </>
        ) : (
          <p className="px-6 py-14 text-center text-sm text-zinc-500">{t.empty}</p>
        )}
      </section>
    </div>
  );
}
