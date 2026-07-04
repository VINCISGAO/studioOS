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
      (sandbox ? "https://openauth.alipaydev.com" : "https://openauth.alipay.com"),
    gatewayUrl:
      readEnv("ALIPAY_GATEWAY_URL") ||
      (sandbox ? "https://openapi.alipaydev.com/gateway.do" : "https://openapi.alipay.com/gateway.do")
  };
}

export function alipayOAuthRedirectUri() {
  return `${getAppBaseUrl()}/auth/alipay/callback`;
}
