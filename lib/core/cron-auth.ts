import { timingSafeEqual } from "node:crypto";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isCronSecretConfigured(): boolean {
  return Boolean(process.env.CRON_SECRET?.trim());
}

export function verifyCronBearer(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;

  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 && safeEqual(token, secret);
}
