import type { Locale } from "@/lib/i18n";

type LabelMap = Record<Locale, string>;

const escrowStatusLabels: Record<string, LabelMap> = {
  PENDING: { en: "Pending", zh: "待入账" },
  HELD: { en: "Held", zh: "托管中" },
  PARTIAL_RELEASE: { en: "Partial release", zh: "部分释放" },
  FULL_RELEASE: { en: "Fully released", zh: "已全部释放" },
  CLOSED: { en: "Closed", zh: "已关闭" },
  REFUNDED: { en: "Refunded", zh: "已退款" }
};

const settlementStateLabels: Record<string, LabelMap> = {
  PENDING: { en: "Pending", zh: "待结算" },
  READY: { en: "Ready", zh: "可释放" },
  RELEASED: { en: "Released", zh: "已释放" },
  COMPLETED: { en: "Completed", zh: "已完成" },
  DISPUTE: { en: "Dispute", zh: "争议中" },
  FAILED: { en: "Failed", zh: "失败" },
  LOCKED: { en: "Locked", zh: "已锁定" },
  FROZEN: { en: "Frozen", zh: "已冻结" },
  CANCELLED: { en: "Cancelled", zh: "已取消" }
};

const deliveryStatusLabels: Record<string, LabelMap> = {
  PENDING: { en: "Pending", zh: "待交付" },
  DELIVERED: { en: "Delivered", zh: "已交付" },
  LOCKED: { en: "Locked", zh: "待结算" },
  APPROVED: { en: "Approved", zh: "已通过" }
};

const payoutStatusLabels: Record<string, LabelMap> = {
  PENDING: { en: "Pending", zh: "待付款" },
  PAID: { en: "Paid", zh: "已付款" },
  MANUAL_PAYOUT_PENDING: { en: "Manual payout pending", zh: "待手动付款" },
  FAILED: { en: "Failed", zh: "失败" }
};

const paymentStatusLabels: Record<string, LabelMap> = {
  PENDING: { en: "Pending", zh: "待支付" },
  PAID: { en: "Paid", zh: "已支付" },
  FAILED: { en: "Failed", zh: "失败" },
  REFUNDED: { en: "Refunded", zh: "已退款" }
};

function pickLabel(map: Record<string, LabelMap>, value: string, locale: Locale) {
  const upper = value.toUpperCase();
  return map[upper]?.[locale] ?? map[value]?.[locale] ?? value;
}

export function adminEscrowStatusLabel(status: string, locale: Locale) {
  return pickLabel(escrowStatusLabels, status, locale);
}

export function adminSettlementStateLabel(state: string, locale: Locale) {
  return pickLabel(settlementStateLabels, state, locale);
}

export function adminDeliveryStatusLabel(status: string, locale: Locale) {
  return pickLabel(deliveryStatusLabels, status, locale);
}

export function adminPayoutStatusLabel(status: string, locale: Locale) {
  return pickLabel(payoutStatusLabels, status, locale);
}

export function adminPaymentStatusLabel(status: string, locale: Locale) {
  return pickLabel(paymentStatusLabels, status, locale);
}
