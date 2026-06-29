import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { disputes, orders, projects, refundRequests } from "@/lib/data";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to admin",
    eyebrow: "Trust and safety",
    title: "Refunds and disputes",
    subtitle:
      "Review refund requests, dispute reasons, platform evidence, and proposed resolutions before releasing escrow or returning funds.",
    disputes: "Disputes",
    refunds: "Refund requests",
    disputeTable: ["Job", "Brand", "Opened by", "Status", "Resolution", "Created"],
    refundTable: ["Order", "Amount", "Status", "Reason", "Created"],
    review: "Review"
  },
  zh: {
    back: "返回管理后台",
    eyebrow: "交易安全",
    title: "退款与争议处理",
    subtitle: "审核退款申请、争议原因、平台证据和处理方案，再决定释放托管款、部分退款或退还资金。",
    disputes: "争议",
    refunds: "退款申请",
    disputeTable: ["任务", "Brand", "发起方", "状态", "处理方案", "创建时间"],
    refundTable: ["订单", "金额", "状态", "原因", "创建时间"],
    review: "审核"
  }
};

type AdminDisputesPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AdminDisputesPage({ searchParams }: AdminDisputesPageProps) {
  const locale = getLocale(await searchParams);
  const t = copy[locale];

  return (
    <div>
      <Button asChild variant="outline" size="sm">
          <Link href={withLocale("/admin", locale)}>
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Link>
        </Button>
        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{t.subtitle}</p>
        </div>

        <Card className="mt-8 shadow-none">
          <CardContent className="p-0">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold">{t.disputes}</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {t.disputeTable.map((heading) => (
                    <TableHead key={heading}>{heading}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => {
                  const order = orders.find((item) => item.id === dispute.order_id);
                  const project = order ? projects.find((item) => item.id === order.project_id) : undefined;
                  return (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-medium">{dispute.order_id}</TableCell>
                      <TableCell>{project?.company_name}</TableCell>
                      <TableCell>{dispute.opened_by}</TableCell>
                      <TableCell>
                        <Badge variant="warning">{dispute.status}</Badge>
                      </TableCell>
                      <TableCell>{dispute.proposed_resolution}</TableCell>
                      <TableCell>{formatDate(dispute.created_at)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Scale className="h-4 w-4" /> {t.review}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="mt-8 shadow-none">
          <CardContent className="p-0">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold">{t.refunds}</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {t.refundTable.map((heading) => (
                    <TableHead key={heading}>{heading}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {refundRequests.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell className="font-medium">{refund.order_id}</TableCell>
                    <TableCell>{formatCurrency(refund.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="warning">{refund.status}</Badge>
                    </TableCell>
                    <TableCell>{refund.reason}</TableCell>
                    <TableCell>{formatDate(refund.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
