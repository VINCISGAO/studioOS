import "server-only";

import { createHash, randomInt, timingSafeEqual, createHmac } from "node:crypto";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { userRepository } from "@/features/auth/user.repository";
import { buildSessionPayload } from "@/features/auth/session.service";
import { resolveSafePostLoginDestination } from "@/lib/auth/post-login-redirect";
import { resolveCreatorIdByEmail } from "@/lib/studioos/creator-settings-service";
import type { Locale } from "@/lib/i18n";
import type { Prisma, UserRole } from "@prisma/client";
import { AUTH_ERROR_COPY } from "@/features/auth/auth-error-copy";
import { checkIdentityRole } from "@/features/auth/identity-role-policy";
import { correctEmailDomain } from "@/lib/auth/email-domain-correction";
import { isStudioTestEmail } from "@/lib/demo-auth";
import { sendEnterpriseEmail } from "@/features/email/email-delivery.service";
import { buildLoginVerificationEmail } from "@/features/email/templates/enterprise-email-templates";

export { AUTH_ERROR_COPY } from "@/features/auth/auth-error-copy";

const VERIFICATION_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const LOCK_15_MIN_MS = 15 * 60 * 1000;

type RequestContext = {
  ip: string;
  ipHash: string;
  userAgent: string;
  userAgentHash: string;
  origin: string;
  referer: string;
};

function now() {
  return new Date();
}

function addMs(date: Date, ms: number) {
  return new Date(date.getTime() + ms);
}

function normalizeEmail(email: string) {
  return correctEmailDomain(email).email;
}

function securitySecret() {
  return (
    process.env.AUTH_SECURITY_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "studioos-dev-auth-security-secret"
  );
}

function hashSensitive(value: string) {
  return createHash("sha256").update(`${securitySecret()}:${value}`).digest("hex");
}

function hashCode(email: string, code: string) {
  return createHash("sha256")
    .update(`${securitySecret()}:${normalizeEmail(email)}:${code}`)
    .digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function requestContext(request: Request): RequestContext {
  const headers = request.headers;
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = headers.get("user-agent") || "unknown";
  return {
    ip,
    ipHash: hashSensitive(ip),
    userAgent,
    userAgentHash: hashSensitive(userAgent),
    origin: headers.get("origin") || "",
    referer: headers.get("referer") || ""
  };
}

function requireAuthSecurityDelegates() {
  const client = prisma as typeof prisma & {
    authLock?: unknown;
    authRateLimit?: unknown;
    emailVerificationCode?: unknown;
    authAttempt?: unknown;
    authAuditLog?: unknown;
  };
  if (
    !client.authLock ||
    !client.authRateLimit ||
    !client.emailVerificationCode ||
    !client.authAttempt ||
    !client.authAuditLog
  ) {
    throw new Error(
      "Auth security Prisma models are unavailable. Run `npx prisma generate` and apply the auth security migration."
    );
  }
}

function verificationTokenPayload(input: { email: string; codeId: string; createdAt: Date }) {
  return {
    email: normalizeEmail(input.email),
    codeId: input.codeId,
    iat: input.createdAt.getTime(),
    exp: input.createdAt.getTime() + VERIFICATION_TTL_MS
  };
}

function signTokenPayload(payload: Record<string, string | number>) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", securitySecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function parseSignedToken(token: string) {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", securitySecret()).update(body).digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      email?: string;
      codeId?: string;
      iat?: number;
      exp?: number;
    };
  } catch {
    return null;
  }
}

function randomCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function sessionRoleForUserProfiles(user: { role: UserRole }, requestedRole: UserRole) {
  if (user.role !== requestedRole) {
    return user.role === "CREATOR" ? ("creator" as const) : ("client" as const);
  }
  return requestedRole === "CREATOR" ? ("creator" as const) : ("client" as const);
}

async function hitRateLimit(input: {
  key: string;
  scope: string;
  max: number;
  windowMs: number;
}) {
  const current = now();
  const existing = await prisma.authRateLimit.findUnique({
    where: { key_scope: { key: input.key, scope: input.scope } }
  });

  if (!existing || existing.expiresAt <= current) {
    await prisma.authRateLimit.upsert({
      where: { key_scope: { key: input.key, scope: input.scope } },
      update: { count: 1, windowStart: current, expiresAt: addMs(current, input.windowMs) },
      create: {
        key: input.key,
        scope: input.scope,
        count: 1,
        windowStart: current,
        expiresAt: addMs(current, input.windowMs)
      }
    });
    return false;
  }

  if (existing.count >= input.max) {
    return true;
  }

  await prisma.authRateLimit.update({
    where: { key_scope: { key: input.key, scope: input.scope } },
    data: { count: { increment: 1 } }
  });
  return false;
}

async function anyRateLimited(rules: Array<{ key: string; scope: string; max: number; windowMs: number }>) {
  for (const rule of rules) {
    if (await hitRateLimit(rule)) return true;
  }
  return false;
}

function isTurnstileEnforced() {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() || process.env.RECAPTCHA_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return Boolean(secret && siteKey);
}

async function verifyTurnstileToken(
  token: string | undefined,
  ip: string,
  options?: { origin?: string; referer?: string; userAgent?: string }
) {
  if (!isTurnstileEnforced()) {
    return true;
  }
  if (!token) {
    // Login UI does not render Turnstile — allow same-origin browser traffic.
    if (options?.origin || options?.referer || looksLikeBrowserUserAgent(options?.userAgent ?? "")) {
      return true;
    }
    return false;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() || process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) {
    return true;
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: ip })
  }).catch(() => null);
  if (!response?.ok) return false;
  const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
  return Boolean(result?.success);
}

function looksLikeBrowserUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  return (
    ua.includes("mozilla") ||
    ua.includes("chrome") ||
    ua.includes("safari") ||
    ua.includes("firefox") ||
    ua.includes("edg/") ||
    ua.includes("iphone") ||
    ua.includes("ipad") ||
    ua.includes("android")
  );
}

async function suspiciousRequest(ctx: RequestContext, input?: { email?: string; provider?: string }) {
  const ua = ctx.userAgent.toLowerCase();
  const suspiciousUa =
    !ctx.userAgent ||
    ua.includes("curl") ||
    ua.includes("python") ||
    ua.includes("bot") ||
    ua.includes("spider") ||
    ua.includes("scrapy");
  const noBrowserOrigin =
    !ctx.origin && !ctx.referer && !looksLikeBrowserUserAgent(ctx.userAgent);
  const emailHash = input?.email ? hashSensitive(normalizeEmail(input.email)) : null;
  const since = addMs(now(), -10 * 60 * 1000);
  const authBurst = await prisma.authAttempt.count({
    where: { ipHash: ctx.ipHash, createdAt: { gte: since } }
  });
  const emailFailures = emailHash
    ? await prisma.authAttempt.count({
        where: { emailHash, success: false, createdAt: { gte: since } }
      })
    : 0;
  const oauthFailures = input?.provider
    ? await prisma.authAttempt.count({
        where: { provider: input.provider, success: false, createdAt: { gte: since } }
      })
    : 0;

  return suspiciousUa || noBrowserOrigin || authBurst >= 20 || emailFailures >= 5 || oauthFailures >= 5;
}

async function audit(input: {
  userId?: string | null;
  email?: string | null;
  event:
    | "EMAIL_CODE_SENT"
    | "EMAIL_CODE_VERIFIED"
    | "SIGNUP_COMPLETED"
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "OAUTH_SUCCESS"
    | "OAUTH_FAILED"
    | "ACCOUNT_LOCKED"
    | "TURNSTILE_REQUIRED"
    | "TURNSTILE_FAILED";
  ctx: RequestContext;
  metadata?: Record<string, unknown>;
}) {
  await prisma.authAuditLog.create({
    data: {
      userId: input.userId ?? null,
      emailHash: input.email ? hashSensitive(normalizeEmail(input.email)) : null,
      event: input.event,
      ipHash: input.ctx.ipHash,
      userAgentHash: input.ctx.userAgentHash,
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    }
  });
}

async function recordAttempt(input: {
  email?: string | null;
  provider?: string | null;
  type: "EMAIL_START" | "CODE_VERIFY" | "PASSWORD_LOGIN" | "OAUTH_CALLBACK";
  success: boolean;
  failureReason?: string;
  ctx: RequestContext;
}) {
  await prisma.authAttempt.create({
    data: {
      emailHash: input.email ? hashSensitive(normalizeEmail(input.email)) : null,
      ipHash: input.ctx.ipHash,
      provider: input.provider ?? null,
      type: input.type,
      success: input.success,
      failureReason: input.failureReason
    }
  });
}

async function sendAuthVerificationCode(
  email: string,
  code: string,
  _locale: Locale
): Promise<
  | { ok: true; debugCode?: string }
  | { ok: false; reason: string }
> {
  if (isStudioTestEmail(email)) {
    return { ok: false as const, reason: "TEST_ACCOUNT_RETIRED" as const };
  }

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false as const, reason: "RESEND_NOT_CONFIGURED" as const };
    }
    return { ok: true as const, debugCode: code };
  }

  const from = process.env.AUTH_EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "VINCIS <hello@vincis.app>";
  const accountLabel = email.split("@")[0]?.trim().toUpperCase() || "USER";
  const emailTemplate = await buildLoginVerificationEmail({ code, accountLabel, validMinutes: 5 });
  const result = await sendEnterpriseEmail({
    from,
    to: email,
    subject: emailTemplate.subject,
    template: emailTemplate.template,
    html: emailTemplate.html,
    requireProvider: true
  });

  return result.ok ? { ok: true as const } : { ok: false as const, reason: result.error };
}

export class AuthSecurityService {
  async verifyEmailContinuationToken(input: { email: string; verificationToken: string }) {
    const email = normalizeEmail(input.email);
    const payload = parseSignedToken(input.verificationToken);
    if (!payload?.email || !payload.codeId || !payload.exp || payload.exp < Date.now()) {
      return false;
    }
    if (payload.email !== email) {
      return false;
    }
    const verified = await prisma.emailVerificationCode.findFirst({
      where: { id: payload.codeId, email, consumedAt: { not: null } }
    });
    return Boolean(verified);
  }

  async startEmailVerification(input: {
    request: Request;
    email: string;
    locale: Locale;
    role: UserRole;
    turnstileToken?: string;
  }) {
    requireAuthSecurityDelegates();
    if (!hasDatabaseUrl()) {
      return { ok: false as const, error: AUTH_ERROR_COPY.securityFailed };
    }

    const ctx = requestContext(input.request);
    const email = normalizeEmail(input.email);
    const emailHash = hashSensitive(email);
    if (!email || !email.includes("@")) {
      return { ok: false as const, error: AUTH_ERROR_COPY.securityFailed };
    }
    if (isStudioTestEmail(email)) {
      return { ok: false as const, error: AUTH_ERROR_COPY.testAccountRetired };
    }

    if (input.role !== "BRAND" && input.role !== "CREATOR") {
      return { ok: false as const, error: AUTH_ERROR_COPY.securityFailed };
    }

    const existing = await userRepository.findByEmail(email);
    const roleCheck = checkIdentityRole(existing, input.role, input.locale);
    if (!roleCheck.ok) {
      return roleCheck;
    }

    const activeLock = await prisma.authLock.findFirst({
      where: { OR: [{ emailHash }, { ipHash: ctx.ipHash }], lockedUntil: { gt: now() } },
      orderBy: { lockedUntil: "desc" }
    });
    if (activeLock) {
      return { ok: false as const, error: AUTH_ERROR_COPY.rateLimited };
    }

    const limited = await anyRateLimited([
      { key: ctx.ipHash, scope: "auth_email_ip_1m", max: 5, windowMs: 60_000 },
      { key: ctx.ipHash, scope: "auth_email_ip_1h", max: 30, windowMs: 60 * 60_000 },
      { key: emailHash, scope: "auth_email_email_1m", max: 3, windowMs: 60_000 },
      { key: emailHash, scope: "auth_email_email_1h", max: 10, windowMs: 60 * 60_000 },
      { key: `${ctx.ipHash}:${emailHash}`, scope: "auth_email_combo_10m", max: 5, windowMs: 10 * 60_000 },
      { key: emailHash, scope: "auth_email_daily", max: 20, windowMs: 24 * 60 * 60_000 },
      { key: ctx.ipHash, scope: "auth_ip_daily", max: 100, windowMs: 24 * 60 * 60_000 }
    ]);
    if (limited) {
      await recordAttempt({ email, type: "EMAIL_START", success: false, failureReason: "rate_limited", ctx });
      return { ok: false as const, error: AUTH_ERROR_COPY.rateLimited };
    }

    if (!isStudioTestEmail(email) && (await suspiciousRequest(ctx, { email }))) {
      await audit({ email, event: "TURNSTILE_REQUIRED", ctx });
      if (!(await verifyTurnstileToken(input.turnstileToken, ctx.ip, ctx))) {
        await audit({ email, event: "TURNSTILE_FAILED", ctx });
        return { ok: false as const, error: AUTH_ERROR_COPY.securityFailed, turnstileRequired: true };
      }
    }

    const lastCode = await prisma.emailVerificationCode.findFirst({
      where: { email, purpose: "SIGNUP_LOGIN" },
      orderBy: { createdAt: "desc" }
    });
    if (lastCode && lastCode.createdAt.getTime() > Date.now() - RESEND_COOLDOWN_MS) {
      return { ok: false as const, error: AUTH_ERROR_COPY.rateLimited };
    }

    await prisma.emailVerificationCode.updateMany({
      where: { email, purpose: "SIGNUP_LOGIN", consumedAt: null },
      data: { consumedAt: now() }
    });

    const code = randomCode();
    const created = await prisma.emailVerificationCode.create({
      data: {
        email,
        codeHash: hashCode(email, code),
        purpose: "SIGNUP_LOGIN",
        maxAttempts: 5,
        expiresAt: addMs(now(), VERIFICATION_TTL_MS),
        ipHash: ctx.ipHash,
        userAgentHash: ctx.userAgentHash
      }
    });

    const sent = await sendAuthVerificationCode(email, code, input.locale);
    if (!sent.ok) {
      await prisma.emailVerificationCode.update({
        where: { id: created.id },
        data: { consumedAt: now() }
      });
      const emailSendError =
        sent.reason === "RESEND_NOT_CONFIGURED"
          ? input.locale === "zh"
            ? "邮件服务未配置。请在环境变量中设置 RESEND_API_KEY。"
            : "Email service is not configured. Set RESEND_API_KEY in environment variables."
          : /verify a domain|only send testing emails/i.test(sent.reason)
            ? input.locale === "zh"
              ? "Resend 测试模式只能发到注册 Resend 的邮箱。请在 Resend 验证域名，或先用注册邮箱测试。"
              : "Resend test mode only delivers to your Resend account email. Verify a domain in Resend, or test with that email first."
            : input.locale === "zh"
              ? "验证码邮件发送失败，请稍后再试。"
              : "Failed to send verification email. Please try again later.";
      return { ok: false as const, error: emailSendError };
    }

    await recordAttempt({ email, type: "EMAIL_START", success: true, ctx });
    await audit({ email, event: "EMAIL_CODE_SENT", ctx });
    const testEmailHint =
      "debugCode" in sent && sent.debugCode
        ? input.locale === "zh"
          ? "开发模式：未配置邮件服务，请使用下方验证码。"
          : "Dev mode: email is not configured. Use the code below."
        : input.locale === "zh"
          ? "验证码已发送至你的邮箱。"
          : "Verification code sent to your email.";
    return {
      ok: true as const,
      message: testEmailHint,
      debugCode: "debugCode" in sent ? sent.debugCode : undefined
    };
  }

  async verifyEmailCode(input: { request: Request; email: string; code: string; turnstileToken?: string }) {
    requireAuthSecurityDelegates();
    const ctx = requestContext(input.request);
    const email = normalizeEmail(input.email);
    const code = input.code.trim();
    const emailHash = hashSensitive(email);
    const activeLock = await prisma.authLock.findFirst({
      where: { OR: [{ emailHash }, { ipHash: ctx.ipHash }], lockedUntil: { gt: now() } },
      orderBy: { lockedUntil: "desc" }
    });
    if (activeLock) {
      return { ok: false as const, error: AUTH_ERROR_COPY.rateLimited };
    }

    const limited = await anyRateLimited([
      { key: ctx.ipHash, scope: "auth_continue_ip_1m", max: 5, windowMs: 60_000 },
      { key: ctx.ipHash, scope: "auth_continue_ip_1h", max: 30, windowMs: 60 * 60_000 },
      { key: emailHash, scope: "auth_continue_email_1m", max: 3, windowMs: 60_000 },
      { key: emailHash, scope: "auth_continue_email_1h", max: 10, windowMs: 60 * 60_000 },
      { key: `${ctx.ipHash}:${emailHash}`, scope: "auth_continue_combo_10m", max: 5, windowMs: 10 * 60_000 }
    ]);
    if (limited) {
      return { ok: false as const, error: AUTH_ERROR_COPY.rateLimited };
    }

    if (!/^\d{6}$/.test(code)) {
      await recordAttempt({ email, type: "CODE_VERIFY", success: false, failureReason: "bad_format", ctx });
      return { ok: false as const, error: AUTH_ERROR_COPY.codeInvalid };
    }

    const verification = await prisma.emailVerificationCode.findFirst({
      where: { email, purpose: "SIGNUP_LOGIN", consumedAt: null },
      orderBy: { createdAt: "desc" }
    });
    if (!verification || verification.expiresAt <= now() || verification.attempts >= verification.maxAttempts) {
      await recordAttempt({ email, type: "CODE_VERIFY", success: false, failureReason: "expired", ctx });
      return { ok: false as const, error: AUTH_ERROR_COPY.codeInvalid };
    }

    if (!safeEqual(hashCode(email, code), verification.codeHash)) {
      const nextAttempts = verification.attempts + 1;
      await prisma.emailVerificationCode.update({
        where: { id: verification.id },
        data: {
          attempts: { increment: 1 },
          ...(nextAttempts >= verification.maxAttempts ? { consumedAt: now() } : {})
        }
      });
      await recordAttempt({ email, type: "CODE_VERIFY", success: false, failureReason: "mismatch", ctx });
      if (nextAttempts >= verification.maxAttempts) {
        await prisma.authLock.create({
          data: {
            emailHash,
            ipHash: ctx.ipHash,
            reason: "email_code_failed",
            lockedUntil: addMs(now(), LOCK_15_MIN_MS)
          }
        });
        await audit({ email, event: "ACCOUNT_LOCKED", ctx, metadata: { reason: "email_code_failed" } });
      }
      return { ok: false as const, error: AUTH_ERROR_COPY.codeInvalid };
    }

    await prisma.emailVerificationCode.update({
      where: { id: verification.id },
      data: { consumedAt: now(), attempts: { increment: 1 } }
    });
    await recordAttempt({ email, type: "CODE_VERIFY", success: true, ctx });
    await audit({ email, event: "EMAIL_CODE_VERIFIED", ctx });

    const existing = await userRepository.findByEmail(email);
    const token = signTokenPayload(
      verificationTokenPayload({ email, codeId: verification.id, createdAt: now() })
    );
    return {
      ok: true as const,
      verificationToken: token,
      mode: existing ? ("login" as const) : ("signup" as const)
    };
  }

  async loginWithEmailCode(input: {
    request: Request;
    email: string;
    code: string;
    role: UserRole;
    locale: Locale;
    nextPath?: string;
    turnstileToken?: string;
  }) {
    const email = normalizeEmail(input.email);
    if (isStudioTestEmail(email)) {
      return { ok: false as const, error: AUTH_ERROR_COPY.testAccountRetired };
    }

    const verified = await this.verifyEmailCode({
      request: input.request,
      email: input.email,
      code: input.code,
      turnstileToken: input.turnstileToken
    });
    if (!verified.ok) {
      return verified;
    }

    const ctx = requestContext(input.request);
    let user = await userRepository.findByEmail(email);
    if (!user) {
      user = await userRepository.createPasswordless({
        email,
        role: input.role,
        fullName: email.split("@")[0] || "VINCIS User",
        companyName: input.role === "BRAND" ? email.split("@")[0] || "VINCIS" : undefined,
        displayName: input.role === "CREATOR" ? email.split("@")[0] || "Creator" : undefined,
        emailVerifiedAt: now()
      });
      await audit({ userId: user.id, email, event: "SIGNUP_COMPLETED", ctx });
    } else {
      const roleCheck = checkIdentityRole(user, input.role, input.locale);
      if (!roleCheck.ok) {
        return roleCheck;
      }

      if (input.role === "BRAND" && !user.brandProfile) {
        user = await userRepository.ensureBrandProfileForUser({
          userId: user.id,
          companyName: user.fullName
        });
      } else if (input.role === "CREATOR" && !user.creatorProfile) {
        user = await userRepository.ensureCreatorProfileForUser({
          userId: user.id,
          displayName: user.fullName
        });
        const { membershipService } = await import("@/features/membership/membership.service");
        await membershipService.ensureDefaultMembershipOnCreatorRegister(
          user.id,
          user.creatorProfile?.id
        );
      }
    }

    await userRepository.touchLogin(user.id, { ip: ctx.ip, device: ctx.userAgent });
    await audit({ userId: user.id, email, event: "LOGIN_SUCCESS", ctx });

    if (user.role === "ADMIN" || user.role === "SUPPORT" || user.role === "SYSTEM") {
      return { ok: false as const, error: AUTH_ERROR_COPY.credentialsInvalid };
    }

    const demoRole = sessionRoleForUserProfiles(user, input.role);
    const session = buildSessionPayload(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        languageCode: user.languageCode ?? user.language ?? "en",
        companyName: user.brandProfile?.companyName,
        displayName: user.creatorProfile?.displayName ?? undefined,
        hasBrandProfile: user.role === "BRAND",
        hasCreatorProfile: user.role === "CREATOR"
      },
      demoRole
    );

    let creatorPortalReady = true;
    if (demoRole === "creator") {
      const creatorId = await resolveCreatorIdByEmail(user.email);
      creatorPortalReady = Boolean(creatorId);
    }

    return {
      ok: true as const,
      redirectTo: resolveSafePostLoginDestination({
        session: { role: demoRole },
        requestedPath: input.nextPath ?? "",
        locale: input.locale,
        creatorPortalReady
      }),
      session
    };
  }

  async assertPasswordLoginAllowed(input: { request: Request; email: string; turnstileToken?: string }) {
    const ctx = requestContext(input.request);
    const email = normalizeEmail(input.email);
    const emailHash = hashSensitive(email);
    const lock = await prisma.authLock.findFirst({
      where: { emailHash, lockedUntil: { gt: now() } },
      orderBy: { lockedUntil: "desc" }
    });
    if (lock) {
      return { ok: false as const, error: "locked" as const };
    }

    if (await suspiciousRequest(ctx, { email })) {
      await audit({ email, event: "TURNSTILE_REQUIRED", ctx });
      if (!(await verifyTurnstileToken(input.turnstileToken, ctx.ip, ctx))) {
        await audit({ email, event: "TURNSTILE_FAILED", ctx });
        return { ok: false as const, error: "turnstile" as const };
      }
    }
    return { ok: true as const };
  }

  async recordPasswordLoginResult(input: {
    request: Request;
    email: string;
    success: boolean;
    userId?: string | null;
  }) {
    const ctx = requestContext(input.request);
    const email = normalizeEmail(input.email);
    const emailHash = hashSensitive(email);
    await recordAttempt({
      email,
      type: "PASSWORD_LOGIN",
      success: input.success,
      failureReason: input.success ? undefined : "invalid_credentials",
      ctx
    });
    await audit({
      userId: input.userId,
      email,
      event: input.success ? "LOGIN_SUCCESS" : "LOGIN_FAILED",
      ctx
    });

    if (input.success) return;

    const since = addMs(now(), -60 * 60_000);
    const failures = await prisma.authAttempt.count({
      where: { emailHash, type: "PASSWORD_LOGIN", success: false, createdAt: { gte: since } }
    });
    if (failures >= 5) {
      await prisma.authLock.create({
        data: {
          emailHash,
          ipHash: ctx.ipHash,
          reason: failures >= 10 ? "password_failed_require_verification" : "password_failed",
          lockedUntil: addMs(now(), LOCK_15_MIN_MS)
        }
      });
      await audit({ email, event: "ACCOUNT_LOCKED", ctx, metadata: { threshold: failures >= 10 ? 10 : 5 } });
    }
  }

  async enforceOAuthStart(input: { request: Request; provider: string; providerAccountId?: string }) {
    if (!hasDatabaseUrl()) {
      return { ok: true as const };
    }

    try {
      requireAuthSecurityDelegates();
    } catch {
      return { ok: true as const };
    }

    const ctx = requestContext(input.request);
    const provider = input.provider.toLowerCase();
    const providerAccountHash = input.providerAccountId ? hashSensitive(input.providerAccountId) : null;

    try {
      const limited = await anyRateLimited([
        { key: ctx.ipHash, scope: "oauth_ip_1m", max: 10, windowMs: 60_000 },
        { key: ctx.ipHash, scope: "oauth_ip_1h", max: 60, windowMs: 60 * 60_000 },
        { key: `${provider}:${ctx.ipHash}`, scope: "oauth_provider_ip_10m", max: 20, windowMs: 10 * 60_000 },
        ...(providerAccountHash
          ? [{ key: providerAccountHash, scope: "oauth_provider_account_1m", max: 5, windowMs: 60_000 }]
          : [])
      ]);
      if (limited) {
        await recordAttempt({ provider, type: "OAUTH_CALLBACK", success: false, failureReason: "rate_limited", ctx });
        return { ok: false as const, error: AUTH_ERROR_COPY.oauthFailed };
      }
    } catch {
      return { ok: true as const };
    }

    return { ok: true as const };
  }

  async recordOAuthCallback(input: {
    request: Request;
    provider: string;
    success: boolean;
    email?: string | null;
    userId?: string | null;
  }) {
    if (!hasDatabaseUrl()) {
      return;
    }

    try {
      requireAuthSecurityDelegates();
    } catch {
      return;
    }

    const ctx = requestContext(input.request);
    try {
      await recordAttempt({
        email: input.email,
        provider: input.provider,
        type: "OAUTH_CALLBACK",
        success: input.success,
        failureReason: input.success ? undefined : "oauth_callback_failed",
        ctx
      });
      await audit({
        userId: input.userId,
        email: input.email,
        event: input.success ? "OAUTH_SUCCESS" : "OAUTH_FAILED",
        ctx,
        metadata: { provider: input.provider }
      });

      if (!input.success) {
        const failures = await prisma.authAttempt.count({
          where: {
            provider: input.provider,
            ipHash: ctx.ipHash,
            type: "OAUTH_CALLBACK",
            success: false,
            createdAt: { gte: addMs(now(), -10 * 60_000) }
          }
        });
        if (failures >= 10) {
          await prisma.authLock.create({
            data: {
              ipHash: ctx.ipHash,
              reason: "oauth_callback_failed",
              lockedUntil: addMs(now(), LOCK_15_MIN_MS)
            }
          });
        }
      }
    } catch {
      // OAuth audit logging must never block the user-facing sign-in flow.
    }
  }
}

export const authSecurityService = new AuthSecurityService();
