import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { parseDemoSession, type DemoSession } from "@/lib/demo-session";
import { demoSessionSecret, encodeDemoSessionPayload } from "@/lib/demo-session-cookie";

type SignedDemoSessionCookie = {
  v: 1;
  payload: DemoSession;
  sig: string;
};

function signPayload(payload: string) {
  return createHmac("sha256", demoSessionSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function serializeDemoSessionCookie(session: DemoSession) {
  const payload = encodeDemoSessionPayload(session);
  const signed: SignedDemoSessionCookie = {
    v: 1,
    payload: {
      email: session.email.trim().toLowerCase(),
      role: session.role,
      userId: session.userId
    },
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
      const payload = encodeDemoSessionPayload(parsed.payload);
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
