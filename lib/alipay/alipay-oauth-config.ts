import { getAppBaseUrl } from "@/lib/app-url";

export type AlipayOAuthConfig = {
  appId: string;
  privateKey: string;
  authBaseUrl: string;
  gatewayUrl: string;
};

function readEnv(name: string, legacyName?: string) {
  return process.env[name]?.trim() || (legacyName ? process.env[legacyName]?.trim() : "") || "";
}

function normalizePrivateKey(raw: string) {
  const value = raw.replace(/\\n/g, "\n").trim();
  if (!value) return "";
  if (value.includes("BEGIN")) return value;
  return `-----BEGIN PRIVATE KEY-----\n${value}\n-----END PRIVATE KEY-----`;
}

export function hasAlipayOAuthConfig() {
  return Boolean(
    readEnv("VINCIS_ALIPAY_APP_ID", "ALIPAY_APP_ID") &&
      readEnv("VINCIS_ALIPAY_PRIVATE_KEY", "ALIPAY_PRIVATE_KEY")
  );
}

/** Live Alipay login — independent of demo-auth shortcuts (needs DB + keys). */
export function isAlipayOAuthLive() {
  return hasAlipayOAuthConfig();
}

export function getAlipayOAuthConfig(): AlipayOAuthConfig | null {
  const appId = readEnv("VINCIS_ALIPAY_APP_ID", "ALIPAY_APP_ID");
  const privateKey = normalizePrivateKey(
    readEnv("VINCIS_ALIPAY_PRIVATE_KEY", "ALIPAY_PRIVATE_KEY")
  );
  if (!appId || !privateKey) {
    return null;
  }

  const sandbox =
    readEnv("VINCIS_ALIPAY_SANDBOX", "ALIPAY_SANDBOX") === "1" ||
    readEnv("VINCIS_ALIPAY_SANDBOX", "ALIPAY_SANDBOX") === "true";

  return {
    appId,
    privateKey,
    authBaseUrl:
      readEnv("VINCIS_ALIPAY_AUTH_BASE_URL", "ALIPAY_AUTH_BASE_URL") ||
      (sandbox
        ? "https://openauth-sandbox.dl.alipaydev.com"
        : "https://openauth.alipay.com"),
    gatewayUrl:
      readEnv("VINCIS_ALIPAY_GATEWAY_URL", "ALIPAY_GATEWAY_URL") ||
      (sandbox ? "https://openapi.alipaydev.com/gateway.do" : "https://openapi.alipay.com/gateway.do")
  };
}

/** Must match Alipay open platform「授权回调地址」exactly (https, no trailing slash). */
export function alipayOAuthRedirectUri() {
  const override = readEnv("VINCIS_ALIPAY_REDIRECT_URI", "ALIPAY_REDIRECT_URI");
  if (override) {
    return override.replace(/\/$/, "");
  }
  return `${getAppBaseUrl()}/auth/alipay/callback`;
}

export function alipayOAuthMode(): "openauth" | "gateway" {
  return readEnv("VINCIS_ALIPAY_OAUTH_MODE", "ALIPAY_OAUTH_MODE") === "gateway"
    ? "gateway"
    : "openauth";
}

/** Canonical publicAppAuthorize URL — must match Alipay docs (redirect_uri encoded once, no state). */
export function buildAlipayPublicAuthorizeUrl(config: AlipayOAuthConfig, redirectUri: string) {
  return `${config.authBaseUrl}/oauth2/publicAppAuthorize.htm?app_id=${config.appId}&scope=auth_user&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export function getAlipayOAuthPublicConfig() {
  const config = getAlipayOAuthConfig();
  if (!config) return null;

  const redirectUri = alipayOAuthRedirectUri();
  return {
    appId: config.appId,
    redirectUri,
    encodedRedirectUri: encodeURIComponent(redirectUri),
    authMode: alipayOAuthMode(),
    sandbox: config.authBaseUrl.includes("alipaydev"),
    authorizePath: `${config.authBaseUrl}/oauth2/publicAppAuthorize.htm`,
    sampleAuthorizeUrl: buildAlipayPublicAuthorizeUrl(config, redirectUri)
  };
}
