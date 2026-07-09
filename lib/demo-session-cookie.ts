import { parseDemoSession, type DemoSession } from "@/lib/demo-session";

type SignedDemoSessionCookie = {
  v: 1;
  payload: DemoSession;
  sig: string;
};

export function demoSessionSecret() {
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

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function encodeDemoSessionPayload(session: DemoSession) {
  const json = JSON.stringify(normalizeSession(session));
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json).toString("base64url");
  }
  return bytesToBase64Url(new TextEncoder().encode(json));
}

async function signPayloadHmac(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

function allowLegacyDemoSessionCookie() {
  return process.env.NODE_ENV !== "production" || process.env.STUDIOOS_ALLOW_LEGACY_SESSION_COOKIE === "1";
}

function parseSignedPayload(parsed: Partial<SignedDemoSessionCookie>) {
  if (parsed.v !== 1 || !parsed.payload || typeof parsed.sig !== "string") {
    return null;
  }
  return {
    payload: normalizeSession(parsed.payload),
    sig: parsed.sig
  };
}

/** Edge-safe signed demo session parser — used by middleware. */
export async function parseDemoSessionCookieAsync(raw: string | undefined): Promise<DemoSession | null> {
  if (!raw) {
    return null;
  }

  try {
    const signed = parseSignedPayload(JSON.parse(raw) as Partial<SignedDemoSessionCookie>);
    if (signed) {
      const encoded = encodeDemoSessionPayload(signed.payload);
      const expected = await signPayloadHmac(demoSessionSecret(), encoded);
      if (expected !== signed.sig) {
        return null;
      }
      return parseDemoSession(JSON.stringify(signed.payload));
    }
  } catch {
    // Fall through to legacy parser.
  }

  if (!allowLegacyDemoSessionCookie()) {
    return null;
  }

  return parseDemoSession(raw);
}
