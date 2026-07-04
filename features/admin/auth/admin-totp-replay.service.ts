import "server-only";

import { createHash } from "node:crypto";
import { findAdminTotpTimeStep } from "@/lib/auth/admin-totp";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export type AdminTotpPurpose = "login" | "step_up" | "setup" | "provision";

const REPLAY_TTL_MS = 120_000;

function hashConsumedCode(adminProfileId: string, code: string, timeStep: number) {
  return createHash("sha256")
    .update(`${adminProfileId}:${code}:${timeStep}`)
    .digest("hex");
}

/** Verify TOTP and atomically consume the code to block replay within the replay window. */
export async function verifyAndConsumeAdminTotp(input: {
  adminProfileId: string;
  secret: string;
  code: string;
  purpose: AdminTotpPurpose;
}): Promise<boolean> {
  const normalized = input.code.replace(/\s/g, "");
  const matchedStep = findAdminTotpTimeStep(input.secret, normalized);
  if (matchedStep === null) return false;

  if (!hasDatabaseUrl()) return true;

  const codeHash = hashConsumedCode(input.adminProfileId, normalized, matchedStep);

  try {
    await prisma.adminTotpConsumption.create({
      data: {
        adminProfileId: input.adminProfileId,
        timeStep: matchedStep,
        codeHash,
        purpose: input.purpose,
        expiresAt: new Date(Date.now() + REPLAY_TTL_MS)
      }
    });
    return true;
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") return false;
    throw error;
  }
}

export async function purgeExpiredTotpConsumptions() {
  if (!hasDatabaseUrl()) return;
  await prisma.adminTotpConsumption.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });
}
