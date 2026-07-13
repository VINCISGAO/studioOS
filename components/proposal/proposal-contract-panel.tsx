import Link from "next/link";
import { acceptQuoteAction, submitQuoteAction } from "@/app/order-actions";
import { DepositRequiredCallout } from "@/components/studioos/deposit-required-callout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StoredMessage } from "@/lib/chat-types";
import type { StoredOrder, StoredQuote } from "@/lib/order-types";
import type { StoredInquiry } from "@/lib/chat-types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { buildProjectContract } from "@/lib/studioos/project-contract";
import { CheckCircle2, FileText } from "lucide-react";

const copy = {
  en: {
    proposalTitle: "Proposal & contract",
    sendProposal: "Send proposal (quote)",
    acceptProposal: "Accept proposal",
    confirmContract: "Confirm — generate project contract",
    contractTitle: "Project contract",
    budget: "Budget",
    deliverables: "Deliverables",
    style: "Style",
    revisions: "Revisions",
    delivery: "Delivery timeline",
    fromDiscussion: "From Proposal Room",
    payStart: "Pay & start production",
    reviewCenter: "Timeline review",
    locked: "Proposal Room locked — production in progress. Use Timeline Review for video notes."
  },
  zh: {
    proposalTitle: "方案与合同",
    sendProposal: "发送方案（报价）",
    acceptProposal: "接受方案",
    confirmContract: "确认 — 生成项目合同",
    contractTitle: "Project Contract",
    budget: "预算",
    deliverables: "交付内容",
    style: "风格",
    revisions: "修改次数",
    delivery: "交付时间",
    fromDiscussion: "来自 Proposal Room 讨论",
    payStart: "付款并开始制作",
    reviewCenter: "时间轴审片",
    locked: "Proposal Room 已锁定 — 制作进行中。请使用时间轴审片批注视频。"
  }
};

export function ProposalContractPanel({
  locale,
  inquiry,
  messages,
  inquiryId,
  clientEmail: _clientEmail,
  clientName: _clientName,
  viewerRole,
  quote,
  order,
  proposalLocked,
  depositPaid = true
}: {
  locale: Locale;
  inquiry: StoredInquiry;
  messages: StoredMessage[];
  inquiryId: string;
  clientEmail: string;
  clientName: string;
  viewerRole: "brand" | "studio";
  quote: StoredQuote | null;
  order: StoredOrder | null;
  proposalLocked: boolean;
  depositPaid?: boolean;
}) {
  const t = copy[locale];
  const contract = quote ? buildProjectContract(inquiry, quote, messages, locale) : null;

  if (proposalLocked && order) {
    const reviewProjectId = order.project_id ?? order.id;
    return (
      <Card className="mt-6 border-zinc-200 bg-zinc-50 shadow-none">
        <CardContent className="p-5">
          <p className="text-sm text-zinc-600">{t.locked}</p>
          <Button asChild className="mt-4 rounded-full">
            <Link href={withLocale(`/brand/projects/${reviewProjectId}/review`, locale)}>{t.reviewCenter}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {viewerRole === "studio" && !quote ? (
        depositPaid ? (
        <Card className="shadow-none">
          <CardContent className="p-5">
            <h2 className="font-semibold">{t.proposalTitle}</h2>
            <form action={submitQuoteAction} className="mt-4 grid gap-3">
              <input type="hidden" name="lang" value={locale} />
              <input type="hidden" name="inquiry_id" value={inquiryId} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="amount">{locale === "zh" ? "报价 USD" : "Amount USD"}</Label>
                  <Input id="amount" name="amount" type="number" min="1" step="1" required />
                </div>
                <div>
                  <Label htmlFor="delivery_days">{locale === "zh" ? "交付周期（天）" : "Delivery days"}</Label>
                  <Input id="delivery_days" name="delivery_days" type="number" min="1" defaultValue={3} />
                </div>
              </div>
              <div>
                <Label htmlFor="summary">{locale === "zh" ? "交付范围" : "Scope"}</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  placeholder="e.g. 3 × 15s TikTok ads, Apple-style, 2 revision rounds"
                  required
                />
              </div>
              <Button type="submit">{t.sendProposal}</Button>
            </form>
          </CardContent>
        </Card>
        ) : (
          <DepositRequiredCallout locale={locale} />
        )
      ) : null}

      {contract ? (
        <Card className="border-emerald-100 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h2 className="font-semibold">{t.contractTitle}</h2>
              <Badge variant="success">V1</Badge>
            </div>
            <dl className="mt-4 divide-y text-sm">
              <ContractRow label={t.budget} value={contract.budgetLabel} />
              <ContractRow label={t.deliverables} value={contract.deliverables} />
              <ContractRow label={t.style} value={contract.style} />
              <ContractRow label={t.revisions} value={contract.revisions} />
              <ContractRow label={t.delivery} value={`${contract.deliveryDays} ${locale === "zh" ? "天" : "days"}`} />
            </dl>
            <p className="mt-4 text-xs font-medium uppercase text-zinc-500">{t.fromDiscussion}</p>
            <ul className="mt-2 space-y-1 text-xs text-zinc-600">
              {contract.summaryLines.map((line, i) => (
                <li key={i}>· {line}</li>
              ))}
            </ul>

            {viewerRole === "brand" && !order ? (
              <form action={acceptQuoteAction} className="mt-5">
                <input type="hidden" name="lang" value={locale} />
                <input type="hidden" name="inquiry_id" value={inquiryId} />
                <input type="hidden" name="quote_id" value={quote!.id} />
                <Button type="submit" className="w-full rounded-full">
                  <CheckCircle2 className="h-4 w-4" /> {t.acceptProposal}
                </Button>
              </form>
            ) : null}

            {viewerRole === "brand" && order?.payment_status === "unpaid" ? (
              <Button asChild className="mt-4 w-full rounded-full">
                <Link href={withLocale(`/orders/${order.id}?pay=1`, locale)}>{t.payStart}</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : viewerRole === "brand" ? (
        <Card className="border-amber-100 bg-amber-50/50 shadow-none">
          <CardContent className="p-5 text-sm text-amber-950">
            {locale === "zh"
              ? "在 Proposal Room 讨论方案。创作者发送正式报价后，此处自动生成项目合同。"
              : "Discuss scope in the Proposal Room. When the studio sends a formal proposal, your Project Contract appears here."}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ContractRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[140px_1fr]">
      <dt className="font-medium text-zinc-500">{label}</dt>
      <dd className="text-zinc-900">{value}</dd>
    </div>
  );
}
