import "server-only";

import { createHash } from "node:crypto";
import type { AdminUser } from "@/features/admin/auth/admin-user.repository";
import { prisma } from "@/lib/core/database/prisma";

const STEP_UP_TTL_MS = 10 * 60 * 1000;

function readPermissions(raw: unknown) {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function recordMasterStepUp(adminUserId: string, sessionToken: string) {
  const profile = await prisma.adminUser.findUnique({ where: { id: adminUserId } });
  if (!profile) return;

  const permissions = readPermissions(profile.permissions);
  await prisma.adminUser.update({
    where: { id: adminUserId },
    data: {
      permissions: {
        ...permissions,
        stepUpAt: new Date().toISOString(),
        stepUpSessionHash: hashSessionToken(sessionToken)
      }
    }
  });
}

export function hasValidMasterStepUp(profile: AdminUser, sessionToken: string | null) {
  if (!sessionToken) return false;

  const permissions = readPermissions(profile.permissions);
  const stepUpAt = typeof permissions.stepUpAt === "string" ? permissions.stepUpAt : null;
  const stepUpSessionHash =
    typeof permissions.stepUpSessionHash === "string" ? permissions.stepUpSessionHash : null;

  if (!stepUpAt || !stepUpSessionHash) return false;
  if (Date.now() - new Date(stepUpAt).getTime() > STEP_UP_TTL_MS) return false;
  return stepUpSessionHash === hashSessionToken(sessionToken);
}
