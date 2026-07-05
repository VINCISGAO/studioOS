import "server-only";

import { getResend } from "@/lib/resend";
import { isProductionRuntime } from "@/lib/auth/admin-security-config";
import type { Locale } from "@/lib/i18n";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isAdminSetupEmailRequired() {
  return isProductionRuntime();
}

export async function sendAdminSetupLinkEmail(input: {
  toEmail: string;
  setupUrl: string;
  locale: Locale;
  masterEmail: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.RESEND_API_KEY) {
    if (isProductionRuntime()) {
      return {
        ok: false,
        error:
          input.locale === "zh"
            ? "生产环境必须配置 RESEND_API_KEY，绑定链接只能发到管理员邮箱。"
            : "RESEND_API_KEY is required in production — setup links must be emailed directly."
      };
    }
    return { ok: false, error: "RESEND_NOT_CONFIGURED" };
  }

  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_NOT_CONFIGURED" };
  }

  const from = process.env.AUTH_EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "VINCIS <onboarding@resend.dev>";
  const subject =
    input.locale === "zh" ? "VINCIS 管理后台 — 验证器绑定" : "VINCIS Admin — Authenticator setup";
  const headline = input.locale === "zh" ? "绑定 Google 验证器" : "Bind Google Authenticator";
  const body =
    input.locale === "zh"
      ? "此链接 30 分钟内有效，且只能在首次打开链接的设备/网络上完成绑定。请勿转发。"
      : "This link expires in 30 minutes and must be completed on the same device/network that opens it first. Do not forward.";
  const cta = input.locale === "zh" ? "打开绑定页面" : "Open setup page";

  const result = await resend.emails.send({
    from,
    to: input.toEmail,
    subject,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafaf8;padding:32px 16px;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;color:#71717a;">VINCIS Admin</p>
          <h1 style="margin:0 0 12px;font-size:22px;color:#09090b;">${headline}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#52525b;">${body}</p>
          <p style="margin:0 0 20px;font-size:13px;color:#71717a;">${input.locale === "zh" ? "由主账号" : "Provisioned by"} ${escapeHtml(input.masterEmail)}</p>
          <a href="${escapeHtml(input.setupUrl)}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 18px;border-radius:10px;">${cta}</a>
        </div>
      </div>
    `
  });

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true };
}
