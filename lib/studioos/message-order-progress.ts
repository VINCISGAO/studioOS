import type { Locale } from "@/lib/i18n";
import type { CreatorNotificationType } from "@/lib/notification-types";
import type { StoredOrder } from "@/lib/order-types";

export type ProgressStep = {
  id: string;
  title: string;
  subtitle: string;
  state: "done" | "current" | "upcoming";
  timestamp?: string;
};

export function buildMessageProgressSteps(
  order: StoredOrder | null,
  notificationType: CreatorNotificationType,
  locale: Locale
): ProgressStep[] {
  const zh = locale === "zh";

  const steps = [
    {
      id: "selected",
      title: zh ? "已选中" : "Selected",
      subtitle: zh ? "品牌已选择你" : "Brand selected you"
    },
    {
      id: "paying",
      title: zh ? "付款中" : "Payment",
      subtitle: zh ? "等待品牌付款" : "Waiting for brand payment"
    },
    {
      id: "production",
      title: zh ? "制作中" : "In production",
      subtitle: zh ? "开始制作后更新" : "Updates after production starts"
    },
    {
      id: "delivery",
      title: zh ? "交付中" : "Delivering",
      subtitle: zh ? "等待交付审片" : "Awaiting delivery review"
    },
    {
      id: "completed",
      title: zh ? "已完成" : "Completed",
      subtitle: zh ? "等待验收" : "Awaiting acceptance"
    }
  ];

  let activeIndex = 0;
  if (order) {
    if (order.status === "completed") {
      activeIndex = 4;
    } else if (order.status === "review" || order.status === "revision") {
      activeIndex = 3;
    } else if (order.status === "in_production") {
      activeIndex = order.payment_status === "escrowed" || order.payment_status === "released" ? 2 : 1;
    } else if (order.payment_status === "escrowed" || order.payment_status === "released") {
      activeIndex = 2;
    } else if (notificationType === "project_funded") {
      activeIndex = 1;
    }
  }

  return steps.map((step, index) => {
    let state: ProgressStep["state"] = "upcoming";
    if (index < activeIndex) state = "done";
    else if (index === activeIndex) state = "current";

    let subtitle = step.subtitle;
    if (step.id === "paying" && order?.payment_status === "escrowed") {
      subtitle = zh ? "品牌已付款" : "Brand payment received";
    }
    if (step.id === "selected" && state !== "upcoming") {
      subtitle = order?.created_at
        ? new Date(order.created_at).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          })
        : subtitle;
    }

    return {
      ...step,
      subtitle,
      state,
      timestamp: step.id === "selected" && order?.created_at ? order.created_at : undefined
    };
  });
}
