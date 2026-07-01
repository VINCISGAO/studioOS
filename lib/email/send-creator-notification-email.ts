import { getResend } from "@/lib/resend";
import type { Locale } from "@/lib/i18n";
import type { CreatorNotificationType } from "@/lib/notification-types";

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
  if (!process.env.RESEND_API_KEY) {
    console.info("[email:creator-notification:skipped]", {
      to: input.to,
      type: input.type,
      project: input.projectTitle
    });
    return { ok: true, skipped: true };
  }

  const resend = getResend();
  if (!resend) {
    return { ok: true, skipped: true };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "StudioOS <onboarding@resend.dev>";
  const copy = emailCopy(input.locale, input.type);
  const requirementsHtml = input.requirementsText
    .split("\n")
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#3f3f46;">${escapeHtml(line)}</p>`)
    .join("");

  try {
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: copy.subject(input.brandName),
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafaf8;padding:32px 16px;">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">StudioOS</p>
            <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;color:#09090b;">${escapeHtml(copy.headline)}</h1>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#52525b;">${escapeHtml(copy.lead)}</p>
            <div style="margin:0 0 24px;padding:16px 18px;border-radius:12px;background:#fafafa;border:1px solid #ececec;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;">${input.locale === "zh" ? "客户需求" : "Client brief"}</p>
              <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#18181b;">${escapeHtml(input.projectTitle)} · ${escapeHtml(input.brandName)}</p>
              ${requirementsHtml}
            </div>
            <a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 18px;border-radius:10px;">${escapeHtml(copy.cta)}</a>
            <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#a1a1aa;">${input.locale === "zh" ? `你好 ${escapeHtml(input.creatorName)}，` : `Hi ${escapeHtml(input.creatorName)}, `}${input.locale === "zh" ? "如有问题可在平台内与品牌方沟通。" : "reply in the workspace if you have questions."}</p>
          </div>
        </div>
      `
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed";
    return { ok: false, error: message };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
