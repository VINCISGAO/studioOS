import { NextResponse } from "next/server";
import { getAlipayOAuthPublicConfig, hasAlipayOAuthConfig } from "@/lib/alipay/alipay-oauth-config";

export const runtime = "nodejs";

export async function GET() {
  if (!hasAlipayOAuthConfig()) {
    return NextResponse.json({
      ok: false,
      error: "Alipay OAuth is not configured on this deployment."
    });
  }

  const config = getAlipayOAuthPublicConfig();
  if (!config) {
    return NextResponse.json({ ok: false, error: "Alipay OAuth config is incomplete." });
  }

  return NextResponse.json({
    ok: true,
    appId: config.appId,
    redirectUri: config.redirectUri,
    encodedRedirectUri: config.encodedRedirectUri,
    authMode: config.authMode,
    sandbox: config.sandbox,
    setup: {
      zh: [
        "登录 open.alipay.com → 你的网页应用 → 开发信息",
        "找到「授权回调地址」，填入 redirectUri（必须完全一致）",
        "确认已添加并开通「获取会员信息」能力",
        "应用公钥与 Vercel 中 ALIPAY_PRIVATE_KEY 为同一对密钥",
        "若仍报「数据出错」，在错误页按 Ctrl+A / Command+A 查看 E004 详情"
      ]
    },
    sampleAuthorizeUrl: `${config.authorizePath}?app_id=${config.appId}&scope=auth_user&redirect_uri=${config.encodedRedirectUri}`
  });
}
