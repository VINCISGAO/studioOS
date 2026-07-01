import type { ConfirmedBriefField } from "@/lib/studioos/confirmed-brief";
import { CREATOR_DEPOSIT_USD } from "@/lib/studioos/deposit-copy";
import { paymentMethodLabel } from "@/lib/studioos/deposit-utils";
import type { Locale } from "@/lib/i18n";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";

const PAYMENT_SUMMARY_SECTION = {
  zh: "付款明细",
  en: "Payment summary"
} as const;

function field(section: string, label: string, value: string): ConfirmedBriefField {
  return { section, label, value };
}

function formatPaidAt(iso: string | null, locale: Locale) {
  const date = iso ? new Date(iso) : new Date();
  return date
    .toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
    .replace(/\//g, "-");
}

function formatAmount(amountUsd: number, locale: Locale) {
  return locale === "zh" ? `$${amountUsd} USD` : `$${amountUsd} USD`;
}

function formatPaymentMethodDisplay(
  method: PayoutMethodType,
  reference: string | undefined,
  locale: Locale
) {
  const label = paymentMethodLabel(method, locale);
  const tail = reference?.replace(/\s+/g, "").slice(-4) || "2388";
  if (method === "paypal" || method === "alipay" || method === "wechat") {
    return `${label} ····${tail}`;
  }
  if (method === "crypto") {
    return `${label} ····${tail}`;
  }
  return `Visa ····${tail}`;
}

export function buildCertificationPaymentSummaryFields(
  locale: Locale,
  input: {
    formId: string;
    paidAt: string | null;
    amountUsd?: number;
    paymentMethod: PayoutMethodType;
    paymentReference?: string;
  }
): ConfirmedBriefField[] {
  const section = PAYMENT_SUMMARY_SECTION[locale];
  const amount = input.amountUsd ?? CREATOR_DEPOSIT_USD;
  const labels =
    locale === "zh"
      ? {
          type: "认证类型",
          amount: "支付金额",
          method: "支付方式",
          time: "支付时间",
          order: "订单编号",
          status: "支付状态"
        }
      : {
          type: "Certification type",
          amount: "Amount",
          method: "Payment method",
          time: "Payment time",
          order: "Order no.",
          status: "Status"
        };

  const certificationType =
    locale === "zh" ? "StudioOS 认证服务商" : "StudioOS Verified Studio";
  const status = locale === "zh" ? "已付款" : "Paid";

  return [
    field(section, labels.type, certificationType),
    field(section, labels.amount, formatAmount(amount, locale)),
    field(section, labels.method, formatPaymentMethodDisplay(input.paymentMethod, input.paymentReference, locale)),
    field(section, labels.time, formatPaidAt(input.paidAt, locale)),
    field(section, labels.order, input.formId),
    field(section, labels.status, status)
  ];
}

export function buildCertificationPaymentSummaryText(fields: ConfirmedBriefField[]) {
  return fields.map((item) => `${item.label}: ${item.value}`).join("\n");
}
