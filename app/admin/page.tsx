import Link from "next/link";
import { DollarSign, FolderKanban, Scale, ShieldCheck, UsersRound, Video } from "lucide-react";
import { approveOnboardingAction, rejectOnboardingAction } from "@/app/onboarding-actions";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { creators, deposits, disputes, orders, projects, refundRequests } from "@/lib/data";
import { listApplications } from "@/lib/onboarding-service";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    eyebrow: "StudioOS Admin",
    title: "Platform overview",
    metrics: {
      projects: "Campaigns",
      orders: "Production jobs",
      paidVolume: "Paid volume",
      unassigned: "Unassigned",
      deposits: "Studio deposits",
      disputes: "Disputes"
    },
    allOrders: "Production pipeline",
    table: ["Job", "Brand", "Status", "Studio", "Payment", "Amount"],
    unassigned: "Unassigned",
    submittedProjects: "Active briefs",
    viewOrder: "View job",
    trustOps: "Trust & payments",
    deposits: "Studio deposits",
    disputes: "Disputes & refunds",
    onboarding: "Studio applications",
    onboardingEmpty: "No studio applications yet.",
    approve: "Approve",
    reject: "Reject",
    pendingApps: "Pending"
  },
  zh: {
    eyebrow: "StudioOS 管理后台",
    title: "平台总览",
    metrics: {
      projects: "Campaign",
      orders: "制作任务",
      paidVolume: "已付款金额",
      unassigned: "未分配",
      deposits: "Studio 保证金",
      disputes: "争议"
    },
    allOrders: "制作流水线",
    table: ["任务", "Brand", "状态", "Studio", "付款", "金额"],
    unassigned: "未分配",
    submittedProjects: "进行中的 Brief",
    viewOrder: "查看任务",
    trustOps: "交易与信任",
    deposits: "Studio 保证金",
    disputes: "争议与退款",
    onboarding: "Studio 入驻申请",
    onboardingEmpty: "暂无 Studio 入驻申请。",
    approve: "通过",
    reject: "拒绝",
    pendingApps: "待审核"
  }
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const t = copy[locale];
  const pendingApplications = await listApplications("pending");
  const revenue = orders.reduce((sum, order) => sum + order.amount, 0);
  const unassigned = orders.filter((order) => !order.assigned_creator_id).length;
  const depositTotal = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
  const metrics = [
    { icon: FolderKanban, label: t.metrics.projects, value: String(projects.length) },
    { icon: Video, label: t.metrics.orders, value: String(orders.length) },
    { icon: DollarSign, label: t.metrics.paidVolume, value: formatCurrency(revenue) },
    { icon: UsersRound, label: t.metrics.unassigned, value: String(unassigned) },
    { icon: ShieldCheck, label: t.metrics.deposits, value: formatCurrency(depositTotal) },
    { icon: Scale, label: t.metrics.disputes, value: String(disputes.length + refundRequests.length) }
  ];

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t.eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t.title}</h1>

      <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="border-zinc-200/80 shadow-none">
            <CardContent className="p-5">
              <Icon className="h-5 w-5 text-zinc-400" />
              <p className="mt-5 text-sm text-zinc-500">{label}</p>
              <div className="mt-2 text-2xl font-semibold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.34fr]">
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-0">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold">{t.allOrders}</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {t.table.map((heading) => (
                    <TableHead key={heading} className={heading === t.table[5] ? "text-right" : undefined}>
                      {heading}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const project = projects.find((item) => item.id === order.project_id);
                  const studio = creators.find((item) => item.id === order.assigned_creator_id);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link href={withLocale(`/admin/orders/${order.id}`, locale)} className="hover:underline">
                          {order.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>{project?.company_name}</div>
                        <div className="text-xs text-zinc-500">{project?.email}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} locale={locale} />
                      </TableCell>
                      <TableCell>{studio?.name ?? t.unassigned}</TableCell>
                      <TableCell>
                        <Badge variant="success">{order.payment_status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(order.amount)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">{t.submittedProjects}</h2>
            <div className="mt-5 space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{project.company_name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{formatDate(project.created_at)}</p>
                    </div>
                    <StatusBadge status={project.status} locale={locale} />
                  </div>
                  <p className="mt-3 text-sm text-zinc-500">{project.campaign_goal}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">{t.onboarding}</h2>
            <Badge variant="warning">
              {t.pendingApps}: {pendingApplications.length}
            </Badge>
          </div>
          <div className="mt-5 space-y-4">
            {pendingApplications.length ? (
              pendingApplications.map((application) => (
                <div key={application.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">{application.studio_name}</p>
                      <p className="mt-1 text-sm text-zinc-500">{application.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <form action={approveOnboardingAction}>
                        <input type="hidden" name="lang" value={locale} />
                        <input type="hidden" name="application_id" value={application.id} />
                        <Button type="submit" size="sm">
                          {t.approve}
                        </Button>
                      </form>
                      <form action={rejectOnboardingAction}>
                        <input type="hidden" name="lang" value={locale} />
                        <input type="hidden" name="application_id" value={application.id} />
                        <Button type="submit" size="sm" variant="outline">
                          {t.reject}
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">{t.onboardingEmpty}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t.trustOps}</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline">
                <Link href={withLocale("/admin/deposits", locale)}>
                  <ShieldCheck className="h-4 w-4" /> {t.deposits}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={withLocale("/admin/disputes", locale)}>
                  <Scale className="h-4 w-4" /> {t.disputes}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
