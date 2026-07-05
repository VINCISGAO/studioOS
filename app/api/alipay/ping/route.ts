import { NextResponse } from "next/server";
import {
  alipayOAuthRedirectUri,
  getAlipayOAuthConfig,
  hasAlipayOAuthConfig
} from "@/lib/alipay/alipay-oauth-config";
import { callAlipayOpenApi } from "@/lib/alipay/alipay-openapi.client";

export const runtime = "nodejs";

/** Read-only diagnostic: verifies AppID + private key can sign Alipay OpenAPI requests. */
export async function GET() {
  if (!hasAlipayOAuthConfig()) {
    return NextResponse.json({ ok: false, error: "Alipay env vars missing" });
  }

  const config = getAlipayOAuthConfig();
  if (!config) {
    return NextResponse.json({ ok: false, error: "Alipay config incomplete" });
  }

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

    return NextResponse.json({
      ok: true,
      appId: config.appId,
      redirectUri: alipayOAuthRedirectUri(),
      signature: "unexpected_success_with_probe_code"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("invalid-signature") || message.includes("验签")) {
      return NextResponse.json({
        ok: false,
        appId: config.appId,
        redirectUri: alipayOAuthRedirectUri(),
        signature: "invalid",
        error: message,
        hint:
          "Vercel 的 ALIPAY_PRIVATE_KEY 与网页应用 VINCIS登录 里上传的应用公钥不是同一对，请重新生成并上传。"
      });
    }

    if (
      message.includes("invalid-auth-code") ||
      message.includes("auth_code") ||
      message.includes("授权码")
    ) {
      return NextResponse.json({
        ok: true,
        appId: config.appId,
        redirectUri: alipayOAuthRedirectUri(),
        signature: "valid",
        hint: "密钥签名正常。若仍无法登录，请核对授权回调地址是否与 redirectUri 一致，并提交网页应用上线审核。"
      });
    }

    return NextResponse.json({
      ok: false,
      appId: config.appId,
      redirectUri: alipayOAuthRedirectUri(),
      signature: "unknown",
      error: message
    });
  }
}
