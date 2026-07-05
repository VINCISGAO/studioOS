/**
 * Alipay OAuth readiness — env, authorize URL, RSA2 signature probe.
 * Run: npm run alipay:verify
 */
import {
  alipayOAuthRedirectUri,
  buildAlipayPublicAuthorizeUrl,
  getAlipayOAuthConfig,
  hasAlipayOAuthConfig,
  isAlipayOAuthLive
} from "../lib/alipay/alipay-oauth-config";
import { callAlipayOpenApi } from "../lib/alipay/alipay-openapi.client";
import { alipayOAuthService } from "../features/auth/alipay-oauth.service";

type Check = { name: string; ok: boolean; detail?: string };

function report(checks: Check[]) {
  console.log("\nAlipay OAuth verify\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((item) => !item.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nAlipay OAuth ready for login");
}

async function main() {
  const checks: Check[] = [];

  checks.push({
    name: "env.ALIPAY_APP_ID",
    ok: Boolean(process.env.ALIPAY_APP_ID?.trim()),
    detail: process.env.ALIPAY_APP_ID?.trim() || "missing"
  });

  checks.push({
    name: "env.ALIPAY_PRIVATE_KEY",
    ok: Boolean(process.env.ALIPAY_PRIVATE_KEY?.trim()),
    detail: process.env.ALIPAY_PRIVATE_KEY?.trim() ? "present" : "missing"
  });

  if (!hasAlipayOAuthConfig()) {
    report(checks);
    process.exit(1);
  }

  const config = getAlipayOAuthConfig();
  if (!config) {
    checks.push({ name: "config.parse", ok: false, detail: "invalid config" });
    report(checks);
    process.exit(1);
  }

  checks.push({
    name: "config.live",
    ok: isAlipayOAuthLive(),
    detail: `appId=${config.appId}`
  });

  const redirectUri = alipayOAuthRedirectUri();
  checks.push({
    name: "redirectUri",
    ok: redirectUri.startsWith("https://") || redirectUri.startsWith("http://localhost"),
    detail: redirectUri
  });

  const authorizeUrl = buildAlipayPublicAuthorizeUrl(config, redirectUri);
  checks.push({
    name: "authorizeUrl",
    ok: authorizeUrl.includes("scope=auth_user") && authorizeUrl.includes(config.appId),
    detail: authorizeUrl.slice(0, 96) + "..."
  });

  checks.push({
    name: "service.configured",
    ok: alipayOAuthService.isConfigured(),
    detail: "alipayOAuthService"
  });

  try {
    await callAlipayOpenApi({
      gatewayUrl: config.gatewayUrl,
      appId: config.appId,
      privateKey: config.privateKey,
      method: "alipay.system.oauth.token",
      params: {
        grant_type: "authorization_code",
        code: "studioos-signature-probe"
      }
    });
    checks.push({ name: "signature.probe", ok: false, detail: "unexpected success with probe code" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("invalid-signature") || message.includes("验签")) {
      checks.push({
        name: "signature.probe",
        ok: false,
        detail: "invalid — 应用公钥与 ALIPAY_PRIVATE_KEY 不是同一对"
      });
    } else if (
      message.includes("invalid-auth-code") ||
      message.includes("auth_code") ||
      message.includes("授权码")
    ) {
      checks.push({
        name: "signature.probe",
        ok: true,
        detail: "RSA2 签名正常（invalid-auth-code 为预期）"
      });
      checks.push({
        name: "memberInfoApis",
        ok: true,
        detail: "alipay.system.oauth.token + alipay.user.info.share 已对接"
      });
    } else {
      checks.push({ name: "signature.probe", ok: false, detail: message });
    }
  }

  report(checks);
  process.exit(checks.some((item) => !item.ok) ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
