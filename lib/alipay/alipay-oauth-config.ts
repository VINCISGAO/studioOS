import { getAppBaseUrl } from "@/lib/app-url";

export type AlipayOAuthConfig = {
  appId: string;
  privateKey: string;
  authBaseUrl: string;
  gatewayUrl: string;
};

function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function normalizePrivateKey(raw: string) {
  const value = raw.replace(/\\n/g, "\n").trim();
  if (!value) return "";
  if (value.includes("BEGIN")) return value;
  return `-----BEGIN PRIVATE KEY-----\n${value}\n-----END PRIVATE KEY-----`;
}

export function hasAlipayOAuthConfig() {
  return Boolean(readEnv("ALIPAY_APP_ID") && readEnv("ALIPAY_PRIVATE_KEY"));
}

export function getAlipayOAuthConfig(): AlipayOAuthConfig | null {
  const appId = readEnv("ALIPAY_APP_ID");
  const privateKey = normalizePrivateKey(readEnv("ALIPAY_PRIVATE_KEY"));
  if (!appId || !privateKey) {
    return null;
  }

  const sandbox = readEnv("ALIPAY_SANDBOX") === "1" || readEnv("ALIPAY_SANDBOX") === "true";

  return {
    appId,
    privateKey,
    authBaseUrl:
      readEnv("ALIPAY_AUTH_BASE_URL") ||
      (sandbox
        ? "https://openauth-sandbox.dl.alipaydev.com"
        : "https://openauth.alipay.com"),
    gatewayUrl:
      readEnv("ALIPAY_GATEWAY_URL") ||
      (sandbox ? "https://openapi.alipaydev.com/gateway.do" : "https://openapi.alipay.com/gateway.do")
  };
}

/** Must match Alipay open platform「授权回调地址」exactly (https, no trailing slash). */
export function alipayOAuthRedirectUri() {
  const override = readEnv("ALIPAY_REDIRECT_URI");
  if (override) {
    return override.replace(/\/$/, "");
  }
  return `${getAppBaseUrl()}/auth/alipay/callback`;
}

export function alipayOAuthMode(): "openauth" | "gateway" {
  return readEnv("ALIPAY_OAUTH_MODE") === "gateway" ? "gateway" : "openauth";
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
    authorizePath: `${config.authBaseUrl}/oauth2/publicAppAuthorize.htm`
  };
}
