import { createHash } from "node:crypto";

function securitySecret() {
  return (
    process.env.AUTH_SECURITY_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "studioos-dev-auth-security-secret"
  );
}

export function hashAdminSensitive(value: string) {
  return createHash("sha256").update(`${securitySecret()}:admin:${value}`).digest("hex");
}

export function adminRequestContext(request: Request) {
  const headers = request.headers;
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown";
  const userAgent = headers.get("user-agent")?.trim() || "unknown";

  return {
    ip,
    ipHash: hashAdminSensitive(ip),
    userAgent,
    userAgentHash: hashAdminSensitive(userAgent)
  };
}
