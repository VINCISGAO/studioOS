import "server-only";

import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { getResend } from "@/lib/resend";

export type EnterpriseEmailResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; error: string };

type SendEnterpriseEmailInput = {
  to: string;
  subject: string;
  html: string;
  template: string;
  userId?: string | null;
  from?: string;
  requireProvider?: boolean;
};

function defaultFrom() {
  return process.env.RESEND_FROM_EMAIL || process.env.AUTH_EMAIL_FROM || "VINCIS <hello@vincis.app>";
}

async function writeEmailLog(input: {
  userId?: string | null;
  toEmail: string;
  template: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
}) {
  if (!hasDatabaseUrl()) return;
  await prisma.emailLog
    .create({
      data: {
        userId: input.userId,
        toEmail: input.toEmail,
        template: input.template,
        status: input.status,
        error: input.error
      }
    })
    .catch(() => undefined);
}

export async function sendEnterpriseEmail(
  input: SendEnterpriseEmailInput
): Promise<EnterpriseEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    const error = "RESEND_API_KEY not configured";
    await writeEmailLog({
      userId: input.userId,
      toEmail: input.to,
      template: input.template,
      status: input.requireProvider && process.env.NODE_ENV === "production" ? "failed" : "skipped",
      error
    });
    if (input.requireProvider && process.env.NODE_ENV === "production") {
      return { ok: false, error };
    }
    return { ok: true, skipped: true };
  }

  const resend = getResend();
  if (!resend) {
    const error = "Resend client unavailable";
    await writeEmailLog({
      userId: input.userId,
      toEmail: input.to,
      template: input.template,
      status: "failed",
      error
    });
    return { ok: false, error };
  }

  try {
    const result = await resend.emails.send({
      from: input.from ?? defaultFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html
    });

    if (result.error) {
      const error = result.error.message || "Email send failed";
      await writeEmailLog({
        userId: input.userId,
        toEmail: input.to,
        template: input.template,
        status: "failed",
        error
      });
      return { ok: false, error };
    }

    await writeEmailLog({
      userId: input.userId,
      toEmail: input.to,
      template: input.template,
      status: "sent"
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed";
    await writeEmailLog({
      userId: input.userId,
      toEmail: input.to,
      template: input.template,
      status: "failed",
      error: message
    });
    return { ok: false, error: message };
  }
}
