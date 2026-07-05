import "server-only";

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  RegistrationResponseJSON
} from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { adminUserRepository } from "@/features/admin/auth/admin-user.repository";
import { completeAdminLogin } from "@/features/admin/auth/admin-auth.service";
import { adminAuthAuditRepository } from "@/features/admin/auth/admin-auth-audit.repository";
import { adminRequestContext } from "@/lib/auth/admin-request-context";
import { getAdminPasskeyConfig } from "@/lib/auth/admin-passkey-config";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";

const CHALLENGE_COOKIE = "studioos_admin_webauthn_challenge";
const CHALLENGE_TTL_SEC = 5 * 60;

type PendingChallenge = {
  challenge: string;
  adminUserId: string;
  email: string;
  purpose: "login" | "register";
};

function parseStoredTransports(raw: string | null | undefined): AuthenticatorTransportFuture[] | undefined {
  if (!raw) return undefined;
  return raw.split(",").filter(Boolean) as AuthenticatorTransportFuture[];
}

function challengeCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: CHALLENGE_TTL_SEC
  };
}

async function storeChallenge(payload: PendingChallenge) {
  const cookieStore = await cookies();
  cookieStore.set(CHALLENGE_COOKIE, JSON.stringify(payload), challengeCookieOptions());
}

async function consumeChallenge(expectedPurpose: PendingChallenge["purpose"]) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CHALLENGE_COOKIE)?.value;
  cookieStore.delete(CHALLENGE_COOKIE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingChallenge;
    if (parsed.purpose !== expectedPurpose || !parsed.challenge || !parsed.adminUserId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function beginAdminPasskeyLogin(input: { request: Request; email: string }) {
  if (!hasDatabaseUrl()) return { ok: false as const, error: "unavailable" as const };

  const email = input.email.trim().toLowerCase();
  const profile = await adminUserRepository.findLoginCandidateByEmail(email);
  if (!profile || profile.status !== "ACTIVE") {
    return { ok: false as const, error: "not_found" as const };
  }

  const credentials = await prisma.adminWebAuthnCredential.findMany({
    where: { adminUserId: profile.id },
    select: { credentialId: true, transports: true }
  });

  if (!credentials.length) {
    return { ok: false as const, error: "no_passkey" as const };
  }

  const { rpID } = getAdminPasskeyConfig();
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: credentials.map((row) => ({
      id: row.credentialId,
      ...(row.transports ? { transports: parseStoredTransports(row.transports) } : {})
    }))
  });

  await storeChallenge({
    challenge: options.challenge,
    adminUserId: profile.id,
    email,
    purpose: "login"
  });

  return { ok: true as const, options };
}

export async function finishAdminPasskeyLogin(input: {
  request: Request;
  email: string;
  response: AuthenticationResponseJSON;
  locale: Locale;
  nextPath?: string;
}) {
  const pending = await consumeChallenge("login");
  if (!pending) return { ok: false as const, error: "challenge_expired" as const };

  const email = input.email.trim().toLowerCase();
  if (email !== pending.email) return { ok: false as const, error: "challenge_expired" as const };

  const profile = await adminUserRepository.findLoginCandidateByEmail(email);
  if (!profile || profile.id !== pending.adminUserId) {
    return { ok: false as const, error: "not_found" as const };
  }

  const credential = await prisma.adminWebAuthnCredential.findUnique({
    where: { credentialId: input.response.id }
  });
  if (!credential || credential.adminUserId !== profile.id) {
    return { ok: false as const, error: "invalid_credential" as const };
  }

  const { origin, rpID } = getAdminPasskeyConfig();
  const verification = await verifyAuthenticationResponse({
    response: input.response,
    expectedChallenge: pending.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: credential.credentialId,
      publicKey: credential.publicKey,
      counter: Number(credential.counter),
      transports: parseStoredTransports(credential.transports)
    }
  });

  if (!verification.verified) {
    return { ok: false as const, error: "verification_failed" as const };
  }

  await prisma.adminWebAuthnCredential.update({
    where: { id: credential.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date()
    }
  });

  const ctx = adminRequestContext(input.request);
  return completeAdminLogin({
    profile,
    email,
    ctx,
    locale: input.locale,
    nextPath: input.nextPath?.trim() ?? "",
    deviceLabel: credential.label ?? "Passkey",
    loginMethod: "passkey"
  });
}

export async function beginAdminPasskeyRegistration(input: {
  adminUserId: string;
  email: string;
}) {
  const { rpID, rpName, origin } = getAdminPasskeyConfig();
  const existing = await prisma.adminWebAuthnCredential.findMany({
    where: { adminUserId: input.adminUserId },
    select: { credentialId: true, transports: true }
  });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: input.email,
    userDisplayName: input.email,
    attestationType: "none",
    excludeCredentials: existing.map((row) => ({ id: row.credentialId })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
      authenticatorAttachment: "platform"
    }
  });

  await storeChallenge({
    challenge: options.challenge,
    adminUserId: input.adminUserId,
    email: input.email,
    purpose: "register"
  });

  return { ok: true as const, options, origin };
}

export async function finishAdminPasskeyRegistration(input: {
  adminUserId: string;
  response: RegistrationResponseJSON;
  label?: string;
}) {
  const pending = await consumeChallenge("register");
  if (!pending || pending.adminUserId !== input.adminUserId) {
    return { ok: false as const, error: "challenge_expired" as const };
  }

  const { origin, rpID } = getAdminPasskeyConfig();
  const verification = await verifyRegistrationResponse({
    response: input.response,
    expectedChallenge: pending.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID
  });

  if (!verification.verified || !verification.registrationInfo) {
    return { ok: false as const, error: "verification_failed" as const };
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  await prisma.adminWebAuthnCredential.create({
    data: {
      adminUserId: input.adminUserId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: credential.transports?.join(",") ?? null,
      label: input.label?.trim() || "Passkey",
      lastUsedAt: new Date()
    }
  });

  return { ok: true as const };
}

export async function listAdminPasskeys(adminUserId: string) {
  const rows = await prisma.adminWebAuthnCredential.findMany({
    where: { adminUserId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      label: true,
      deviceType: true,
      backedUp: true,
      createdAt: true,
      lastUsedAt: true
    }
  });

  return rows.map((row) => ({
    id: row.id,
    label: row.label ?? "Passkey",
    deviceType: row.deviceType,
    backedUp: row.backedUp,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null
  }));
}

export async function deleteAdminPasskey(input: { adminUserId: string; credentialRowId: string }) {
  const row = await prisma.adminWebAuthnCredential.findFirst({
    where: { id: input.credentialRowId, adminUserId: input.adminUserId }
  });
  if (!row) return { ok: false as const, error: "not_found" as const };

  await prisma.adminWebAuthnCredential.delete({ where: { id: row.id } });
  return { ok: true as const };
}

export async function countAdminPasskeys(adminUserId: string) {
  return prisma.adminWebAuthnCredential.count({ where: { adminUserId } });
}
