import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Upload } from "lucide-react";
import { updateOrderAction } from "@/app/actions";
import { PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { adminOrderService } from "@/features/admin/order/admin-order.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to admin",
    details: "Submitted project details",
    labels: {
      company: "Company",
      email: "Email",
      productUrl: "Product URL",
      category: "Category",
      platform: "Target platform",
      format: "Video format",
      count: "Video count",
      budget: "Budget range",
      deadline: "Deadline",
      style: "Brand style",
      refs: "Reference links",
      goal: "Campaign goal",
      notes: "Notes",
      none: "None"
    },
    payments: "Payments",
    plan: "Quote",
    amount: "Amount",
    stripeSession: "Stripe session",
    controls: "Order controls",
    status: "Status",
    creator: "Assigned creator",
    creatorPlaceholder: "Assign approved creator",
    save: "Save order changes",
    upload: "Upload deliverable",
    videoFile: "Video file",
    thumbnail: "Thumbnail",
    reviewPlaceholder: "What should the client review?",
    uploadButton: "Upload manually",
    history: "Deliverable history",
    version: "Version",
    noHistory: "No deliverables uploaded yet."
  },
  zh: {
    back: "返回管理后台",
    details: "已提交项目详情",
    labels: {
      company: "公司",
      email: "邮箱",
      productUrl: "产品链接",
      category: "类别",
      platform: "目标平台",
      format: "视频格式",
      count: "视频数量",
      budget: "预算范围",
      deadline: "截止日期",
      style: "品牌风格",
      refs: "参考链接",
      goal: "广告目标",
      notes: "补充说明",
      none: "无"
    },
    payments: "付款信息",
    plan: "报价",
    amount: "金额",
    stripeSession: "Stripe 会话",
    controls: "订单控制",
    status: "状态",
    creator: "已分配创作者",
    creatorPlaceholder: "分配已批准创作者",
    save: "保存订单变更",
    upload: "上传交付文件",
    videoFile: "视频文件",
    thumbnail: "缩略图",
    reviewPlaceholder: "客户需要审核什么？",
    uploadButton: "手动上传",
    history: "交付历史",
    version: "版本",
    noHistory: "还没有上传交付文件。"
  }
};

type AdminOrderPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function AdminOrderPage({ params, searchParams }: AdminOrderPageProps) {
  const { id } = await params;
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();

  if (!user) {
    notFound();
  }

  let detail;
  try {
    detail = await adminOrderService.getDetail(user, id);
  } catch {
    notFound();
  }

  const { order, project, deliverables: orderDeliverables } = detail;
  const creators = await adminOrderService.listCreatorsForAssignment(user);
  const statuses = adminOrderService.orderStatuses;
  const assignedCreator = creators.find((item) => item.legacyCreatorId === order.creator_id);

  return (
    <PageShell locale={locale}>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href={withLocale("/admin", locale)} className="text-sm text-muted-foreground hover:text-foreground">
          {t.back}
        </Link>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">{order.id}</h1>
            <p className="mt-2 text-muted-foreground">
              {project?.company_name} · {formatCurrency(order.amount)} · {order.payment_status}
            </p>
          </div>
          <StatusBadge status={order.status} locale={locale} />
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.62fr_0.38fr]">
          <section className="space-y-5">
            <Card className="shadow-none">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">{t.details}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    [t.labels.company, project?.company_name],
                    [t.labels.email, project?.email],
                    [t.labels.productUrl, project?.product_url],
                    [t.labels.category, project?.category],
                    [t.labels.platform, project?.target_platform],
                    [t.labels.format, project?.video_format],
                    [t.labels.count, project?.video_count],
                    [t.labels.budget, project?.budget_range],
                    [t.labels.deadline, project ? formatDate(project.deadline) : ""],
                    [t.labels.style, project?.brand_style],
                    [t.labels.refs, project?.reference_links || t.labels.none],
                    [t.labels.goal, project?.campaign_goal]
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg border p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-2 break-words text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {t.labels.notes}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{project?.notes}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">{t.payments}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <Metric label={t.plan} value={order.title || order.quote_id} />
                  <Metric label={t.amount} value={formatCurrency(order.amount)} />
                  <Metric label={t.stripeSession} value={order.payment_status} />
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-5">
            <Card className="shadow-none">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">{t.controls}</h2>
                <form action={updateOrderAction} className="mt-5 grid gap-4">
                  <input type="hidden" name="order_id" value={order.id} />
                  <input type="hidden" name="lang" value={locale} />
                  <div className="grid gap-2">
                    <Label>{t.status}</Label>
                    <Select name="status" defaultValue={order.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t.creator}</Label>
                    <Select name="assigned_creator_id" defaultValue={assignedCreator?.legacyCreatorId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.creatorPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {creators.map((creator) => (
                          <SelectItem key={creator.legacyCreatorId} value={creator.legacyCreatorId}>
                            {creator.name} · {creator.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>{t.save}</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">{t.upload}</h2>
                <form action={updateOrderAction} className="mt-5 grid gap-4">
                  <input type="hidden" name="order_id" value={order.id} />
                  <input type="hidden" name="lang" value={locale} />
                  <div className="grid gap-2">
                    <Label htmlFor="file">{t.videoFile}</Label>
                    <Input id="file" name="file" type="file" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="thumbnail">{t.thumbnail}</Label>
                    <Input id="thumbnail" name="thumbnail" type="file" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">{t.labels.notes}</Label>
                    <Textarea id="notes" name="notes" placeholder={t.reviewPlaceholder} />
                  </div>
                  <Button variant="outline">
                    <Upload className="h-4 w-4" /> {t.uploadButton}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">{t.history}</h2>
                <div className="mt-4 space-y-3">
                  {orderDeliverables.length ? (
                    orderDeliverables.map((deliverable) => (
                      <div key={deliverable.id} className="rounded-lg border p-4">
                        <p className="font-medium">{t.version} {deliverable.version}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(deliverable.created_at)}
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground">{deliverable.notes}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.noHistory}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-sm font-medium">{value}</p>
    </div>
  );
}
