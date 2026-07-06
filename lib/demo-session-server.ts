import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { parseDemoSession, type DemoSession } from "@/lib/demo-session";

type SignedDemoSessionCookie = {
  v: 1;
  payload: DemoSession;
  sig: string;
};

function sessionSecret() {
  return (
    process.env.AUTH_SECURITY_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "studioos-dev-demo-session-secret"
  );
}

function normalizeSession(session: DemoSession): DemoSession {
  return {
    email: session.email.trim().toLowerCase(),
    role: session.role,
    userId: session.userId
  };
}

function encodePayload(session: DemoSession) {
  return Buffer.from(JSON.stringify(normalizeSession(session))).toString("base64url");
}

function signPayload(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function serializeDemoSessionCookie(session: DemoSession) {
  const payload = encodePayload(session);
  const signed: SignedDemoSessionCookie = {
    v: 1,
    payload: normalizeSession(session),
    sig: signPayload(payload)
  };
  return JSON.stringify(signed);
}

export function parseServerDemoSession(raw: string | undefined): DemoSession | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SignedDemoSessionCookie>;
    if (parsed.v === 1 && parsed.payload && typeof parsed.sig === "string") {
      const payload = encodePayload(parsed.payload);
      if (!safeEqual(signPayload(payload), parsed.sig)) {
        return null;
      }
      return parseDemoSession(JSON.stringify(parsed.payload));
    }
  } catch {
    // Fall back to the legacy parser below for existing development/demo cookies.
  }

  if (process.env.NODE_ENV === "production" && process.env.STUDIOOS_ALLOW_LEGACY_SESSION_COOKIE !== "1") {
    return null;
  }

  return parseDemoSession(raw);
}
