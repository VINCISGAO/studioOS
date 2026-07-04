import "server-only";

import { adminAuthAuditRepository } from "@/features/admin/auth/admin-auth-audit.repository";
import { logger } from "@/lib/core/logger";

type AlertPayload = {
  event: "admin_login_success" | "admin_login_new_ip" | "admin_setup_link_sent";
  email?: string;
  ipHash: string;
  metadata?: Record<string, unknown>;
};

async function postWebhook(payload: AlertPayload) {
  const url = process.env.ADMIN_SECURITY_WEBHOOK_URL?.trim();
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "studioos-admin",
        at: new Date().toISOString(),
        ...payload
      })
    });
  } catch (error) {
    logger.warn("admin security webhook failed", {
      service: "admin-security-alert",
      event: payload.event,
      error: error instanceof Error ? error.message : "unknown"
    });
  }
}

export async function notifyAdminLoginSuccess(input: {
  email: string;
  ipHash: string;
  userAgentHash: string;
  isNewIp: boolean;
  metadata?: Record<string, unknown>;
}) {
  void adminAuthAuditRepository.write({
    event: "admin_login_success",
    success: true,
    email: input.email,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
    metadata: {
      ...(input.metadata ?? {}),
      ...(input.isNewIp ? { newIp: true } : {})
    }
  });

  await postWebhook({
    event: input.isNewIp ? "admin_login_new_ip" : "admin_login_success",
    email: input.email,
    ipHash: input.ipHash,
    metadata: { newIp: input.isNewIp, ...(input.metadata ?? {}) }
  });
}

export async function notifyAdminSetupLinkSent(input: {
  targetEmail: string;
  masterEmail: string;
  ipHash: string;
}) {
  await postWebhook({
    event: "admin_setup_link_sent",
    email: input.targetEmail,
    ipHash: input.ipHash,
    metadata: { masterEmail: input.masterEmail, delivery: "email" }
  });
}
