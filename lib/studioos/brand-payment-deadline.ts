import type { Locale } from "@/lib/i18n";
import type { StoredOrder } from "@/lib/order-types";

export const BRAND_PAYMENT_DEADLINE_HOURS = 3;
export const BRAND_PAYMENT_DEADLINE_MS = BRAND_PAYMENT_DEADLINE_HOURS * 60 * 60 * 1000;

export function resolveBrandPaymentDeadlineAt(order: Pick<StoredOrder, "created_at">): Date {
  return new Date(new Date(order.created_at).getTime() + BRAND_PAYMENT_DEADLINE_MS);
}

export function getBrandPaymentDeadlineRemainingMs(order: Pick<StoredOrder, "created_at">, now = Date.now()): number {
  return Math.max(0, resolveBrandPaymentDeadlineAt(order).getTime() - now);
}

export function isBrandPaymentDeadlineExpired(order: Pick<StoredOrder, "created_at">, now = Date.now()): boolean {
  return getBrandPaymentDeadlineRemainingMs(order, now) <= 0;
}

export function formatBrandPaymentDeadlineRemaining(
  order: Pick<StoredOrder, "created_at">,
  locale: Locale,
  now = Date.now()
): string {
  const remainingMs = getBrandPaymentDeadlineRemainingMs(order, now);
  if (remainingMs <= 0) {
    return locale === "zh" ? "已超时" : "Expired";
  }

  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (locale === "zh") {
    if (hours > 0 && minutes > 0) return `${hours} 小时 ${minutes} 分钟`;
    if (hours > 0) return `${hours} 小时`;
    return `${minutes} 分钟`;
  }

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export function brandPaymentDeadlinePolicyCopy(locale: Locale) {
  if (locale === "zh") {
    return {
      title: "请在 3 小时内完成付款",
      body: "下单后 3 小时内未付款，订单将自动取消；若已选定 Creator，对方会收到取消通知。",
      countdown: (remaining: string) => `剩余付款时间：${remaining}`
    };
  }

  return {
    title: "Complete payment within 3 hours",
    body: "Unpaid orders are cancelled automatically after 3 hours. If you already selected a creator, they will be notified.",
    countdown: (remaining: string) => `Time left to pay: ${remaining}`
  };
}
