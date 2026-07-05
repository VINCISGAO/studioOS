import { getResend } from "@/lib/resend";
import { prisma } from "@/lib/core/database/prisma";

export async function sendNotificationEmail(input: {
  userId: string;
  toEmail: string;
  subject: string;
  html: string;
  template: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    await prisma.emailLog.create({
      data: {
        userId: input.userId,
        toEmail: input.toEmail,
        template: input.template,
        status: "skipped",
        error: "RESEND_API_KEY not configured"
      }
    });
    return { ok: true as const, skipped: true };
  }

  const resend = getResend();
  if (!resend) {
    return { ok: true as const, skipped: true };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "VINCIS <onboarding@resend.dev>";

  try {
    const result = await resend.emails.send({
      from,
      to: input.toEmail,
      subject: input.subject,
      html: input.html
    });

    if (result.error) {
      await prisma.emailLog.create({
        data: {
          userId: input.userId,
          toEmail: input.toEmail,
          template: input.template,
          status: "failed",
          error: result.error.message
        }
      });
      return { ok: false as const, error: result.error.message };
    }

    await prisma.emailLog.create({
      data: {
        userId: input.userId,
        toEmail: input.toEmail,
        template: input.template,
        status: "sent"
      }
    });
    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed";
    await prisma.emailLog.create({
      data: {
        userId: input.userId,
        toEmail: input.toEmail,
        template: input.template,
        status: "failed",
        error: message
      }
    });
    return { ok: false as const, error: message };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSimpleNotificationEmail(input: {
  headline: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
}) {
  const cta = input.actionUrl
    ? `<a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 18px;border-radius:10px;">${escapeHtml(input.actionLabel ?? "Open")}</a>`
    : "";

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafaf8;padding:32px 16px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">VINCIS</p>
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.2;color:#09090b;">${escapeHtml(input.headline)}</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#52525b;">${escapeHtml(input.body)}</p>
        ${cta}
      </div>
    </div>
  `;
}
