import "server-only";

import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { readAdminSessionToken } from "@/features/admin/auth/admin-session-server";
import { adminSessionRepository } from "@/features/admin/auth/admin-session.repository";
import { adminRequestContext } from "@/lib/auth/admin-request-context";
import { createHash } from "node:crypto";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function summarizeUserAgent(userAgent: string) {
  if (/iPhone|iPad/i.test(userAgent)) return "Safari · iOS";
  if (/Android/i.test(userAgent)) return "Chrome · Android";
  if (/Mac OS X/i.test(userAgent) && /Chrome/i.test(userAgent)) return "Chrome · macOS";
  if (/Mac OS X/i.test(userAgent) && /Safari/i.test(userAgent)) return "Safari · macOS";
  if (/Windows/i.test(userAgent) && /Chrome/i.test(userAgent)) return "Chrome · Windows";
  if (/Firefox/i.test(userAgent)) return "Firefox";
  return "Browser";
}

export async function listAdminSessionsForProfile(adminProfileId: string, currentToken: string | null) {
  if (!hasDatabaseUrl()) return [];

  const currentHash = currentToken ? hashToken(currentToken) : null;
  const rows = await prisma.adminSession.findMany({
    where: {
      adminProfileId,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return rows.map((row) => ({
    id: row.id,
    deviceLabel: row.deviceLabel ?? "Unknown device",
    createdAt: row.createdAt.toISOString(),
    lastActiveAt: (row.lastActiveAt ?? row.createdAt).toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    isCurrent: currentHash ? row.tokenHash === currentHash : false
  }));
}

export async function revokeAdminSessionById(input: {
  adminProfileId: string;
  sessionId: string;
  currentToken: string | null;
}) {
  const row = await prisma.adminSession.findFirst({
    where: {
      id: input.sessionId,
      adminProfileId: input.adminProfileId,
      revokedAt: null
    }
  });
  if (!row) return { ok: false as const, error: "not_found" as const };

  await prisma.adminSession.update({
    where: { id: row.id },
    data: { revokedAt: new Date() }
  });

  if (input.currentToken && row.tokenHash === hashToken(input.currentToken)) {
    return { ok: true as const, revokedCurrent: true as const };
  }

  return { ok: true as const, revokedCurrent: false as const };
}

export async function revokeOtherAdminSessions(adminProfileId: string, currentToken: string | null) {
  if (!currentToken) return 0;
  const currentHash = hashToken(currentToken);
  const result = await prisma.adminSession.updateMany({
    where: {
      adminProfileId,
      revokedAt: null,
      tokenHash: { not: currentHash }
    },
    data: { revokedAt: new Date() }
  });
  return result.count;
}

export async function touchAdminSessionActivity(token: string, request?: Request) {
  if (!hasDatabaseUrl() || !token) return;

  const ctx = request ? adminRequestContext(request) : null;
  await prisma.adminSession.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { lastActiveAt: new Date() }
  });
}

export function deriveDeviceLabel(request: Request) {
  return summarizeUserAgent(adminRequestContext(request).userAgent);
}

export { adminSessionRepository };
