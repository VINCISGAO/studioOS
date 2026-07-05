import { createHash } from "node:crypto";
import { adminAuthAuditRepository } from "@/features/admin/auth/admin-auth-audit.repository";
import { adminUserRepository } from "@/features/admin/auth/admin-user.repository";
import { adminRequestContext } from "@/lib/auth/admin-request-context";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

const WINDOW_MS = 15 * 60 * 1000;
/** Non-master: all login tries from one IP. */
const IP_ATTEMPT_MAX = 40;
/** Non-master: failed tries per email. */
const EMAIL_FAIL_MAX = 15;
/** Master: only failed tries from one IP — correct codes never consume budget. */
const MASTER_IP_FAIL_MAX = 80;
const SETUP_IP_MAX = 30;
const SETUP_TOKEN_MAX = 12;

type Bucket = { count: number; resetAt: number };

const ipBuckets = new Map<string, Bucket>();
const emailFailBuckets = new Map<string, Bucket>();
const masterIpFailBuckets = new Map<string, Bucket>();
const setupIpBuckets = new Map<string, Bucket>();
const setupTokenBuckets = new Map<string, Bucket>();

function touchMemoryBucket(store: Map<string, Bucket>, key: string, max: number) {
  const now = Date.now();
  let bucket = store.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > max) {
    throw appError("RATE_LIMIT", "Too many login attempts. Try again later.");
  }
}

async function enforceDbLoginLimit(input: {
  ipHash: string;
  email: string;
  isMaster: boolean;
  userAgentHash: string;
}) {
  const since = new Date(Date.now() - WINDOW_MS);

  if (input.isMaster) {
    const ipFailCount = await adminAuthAuditRepository.countRecentFailedLogins({
      ipHash: input.ipHash,
      since
    });
    if (ipFailCount >= MASTER_IP_FAIL_MAX) {
      void adminAuthAuditRepository.write({
        event: "admin_login_rate_limited",
        success: false,
        email: input.email,
        ipHash: input.ipHash,
        userAgentHash: input.userAgentHash,
        failureReason: "master_ip_fail_rate_limit"
      });
      throw appError("RATE_LIMIT", "Too many login attempts. Try again later.");
    }
    return;
  }

  const [ipCount, emailFailCount] = await Promise.all([
    adminAuthAuditRepository.countRecentLoginAttempts({ ipHash: input.ipHash, since }),
    adminAuthAuditRepository.countRecentFailedLogins({ email: input.email, since })
  ]);

  if (ipCount >= IP_ATTEMPT_MAX) {
    void adminAuthAuditRepository.write({
      event: "admin_login_rate_limited",
      success: false,
      email: input.email,
      ipHash: input.ipHash,
      userAgentHash: input.userAgentHash,
      failureReason: "ip_rate_limit"
    });
    throw appError("RATE_LIMIT", "Too many login attempts. Try again later.");
  }

  if (emailFailCount >= EMAIL_FAIL_MAX) {
    void adminAuthAuditRepository.write({
      event: "admin_login_rate_limited",
      success: false,
      email: input.email,
      ipHash: input.ipHash,
      userAgentHash: input.userAgentHash,
      failureReason: "email_fail_rate_limit"
    });
    throw appError("RATE_LIMIT", "Too many login attempts. Try again later.");
  }
}

/** Cross-instance brute-force guard for /api/admin/auth/login. */
export async function enforceAdminLoginRateLimit(request: Request, email: string) {
  const ctx = adminRequestContext(request);
  const normalizedEmail = email.trim().toLowerCase();
  const isMaster = await adminUserRepository.isMasterLoginEmail(normalizedEmail);

  if (hasDatabaseUrl()) {
    await enforceDbLoginLimit({
      ipHash: ctx.ipHash,
      email: normalizedEmail,
      isMaster,
      userAgentHash: ctx.userAgentHash
    });
    return;
  }

  if (isMaster) {
    touchMemoryBucket(masterIpFailBuckets, ctx.ipHash, MASTER_IP_FAIL_MAX);
    return;
  }

  touchMemoryBucket(ipBuckets, ctx.ipHash, IP_ATTEMPT_MAX);
  touchMemoryBucket(emailFailBuckets, normalizedEmail, EMAIL_FAIL_MAX);
}

export async function enforceAdminSetupTotpRateLimit(request: Request, token?: string) {
  const ctx = adminRequestContext(request);
  const since = new Date(Date.now() - WINDOW_MS);

  if (hasDatabaseUrl()) {
    const ipCount = await adminAuthAuditRepository.countRecentSetupFailures({
      ipHash: ctx.ipHash,
      since
    });
    if (ipCount >= SETUP_IP_MAX) {
      throw appError("RATE_LIMIT", "Too many setup attempts. Try again later.");
    }
  } else {
    touchMemoryBucket(setupIpBuckets, ctx.ipHash, SETUP_IP_MAX);
  }

  if (token) {
    const tokenHash = createHash("sha256").update(token).digest("hex").slice(0, 16);
    touchMemoryBucket(setupTokenBuckets, tokenHash, SETUP_TOKEN_MAX);
  }
}

export function resetAdminLoginRateLimitForTests() {
  ipBuckets.clear();
  emailFailBuckets.clear();
  masterIpFailBuckets.clear();
  setupIpBuckets.clear();
  setupTokenBuckets.clear();
}
