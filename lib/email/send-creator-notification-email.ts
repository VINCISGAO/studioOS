import type { Locale } from "@/lib/i18n";
import type { CreatorNotificationType } from "@/lib/notification-types";
import { sendEnterpriseEmail } from "@/features/email/email-delivery.service";
import {
  buildCollaborationSelectedEmail,
  buildPlainLifecycleEmail
} from "@/features/email/templates/enterprise-email-templates";

type SendCreatorEmailInput = {
  to: string;
  creatorName: string;
  locale: Locale;
  type: CreatorNotificationType;
  brandName: string;
  projectTitle: string;
  requirementsText: string;
  actionUrl: string;
};

function emailCopy(locale: Locale, type: CreatorNotificationType) {
  if (locale === "zh") {
    if (type === "order_cancelled_unpaid") {
      return {
        subject: (brand: string) => `${brand} 的订单已取消`,
        headline: "订单已自动取消",
        lead: "品牌方未在 3 小时内完成付款，该订单已自动取消，你无需继续等待或开始制作。",
        cta: "查看消息"
      };
    }
    return type === "project_funded"
      ? {
          subject: (brand: string) => `款项已托管 — ${brand} 的项目可以开拍`,
          headline: "客户已完成付款，可以开始制作",
          lead: "品牌方已完成托管付款。请登录创作者中心查看完整需求并开始交付。",
          cta: "查看客户需求"
        }
      : {
          subject: (brand: string) => `你被 ${brand} 选中了`,
          headline: "恭喜，品牌方选择了你",
          lead: "品牌方已将你选为合作创作者。请等待品牌完成托管付款，收到付款通知后再开始制作。",
          cta: "查看项目"
        };
  }

  if (type === "order_cancelled_unpaid") {
    return {
      subject: (brand: string) => `Order cancelled — ${brand}`,
      headline: "Order automatically cancelled",
      lead: "The brand did not complete payment within 3 hours. This order is closed — no further action is needed.",
      cta: "View messages"
    };
  }

  return type === "project_funded"
    ? {
        subject: (brand: string) => `Escrow funded — start production for ${brand}`,
        headline: "Payment secured — production can begin",
        lead: "The brand has completed escrow payment. Sign in to review the full brief and start delivery.",
        cta: "View client brief"
      }
    : {
        subject: (brand: string) => `You were selected by ${brand}`,
        headline: "A brand chose your studio",
        lead: "You have been matched to a new campaign. Wait for escrow payment — you'll be notified when production can begin.",
        cta: "View project"
      };
}

export async function sendCreatorNotificationEmail(input: SendCreatorEmailInput): Promise<{
  ok: boolean;
  skipped?: boolean;
  error?: string;
}> {
  const copy = emailCopy(input.locale, input.type);
  const rendered =
    input.type === "creator_selected"
      ? await buildCollaborationSelectedEmail({
          brand: input.brandName,
          project: input.projectTitle,
          budget: "Pending escrow",
          deadline: "See project workspace",
          actionUrl: input.actionUrl
        })
      : await buildPlainLifecycleEmail({
          template: "notification.generic",
          subject: copy.subject(input.brandName),
          title: copy.headline,
          subtitle: copy.lead,
          details: [
            { label: input.locale === "zh" ? "客户需求" : "Client brief", value: input.projectTitle },
            { label: "Brand", value: input.brandName }
          ],
          actionUrl: input.actionUrl,
          actionLabel: copy.cta,
          note: input.requirementsText
        });

  const result = await sendEnterpriseEmail({
    to: input.to,
    subject: rendered.subject,
    template: rendered.template,
    html: rendered.html
  });

  return result.ok ? result : { ok: false, error: result.error };
}
