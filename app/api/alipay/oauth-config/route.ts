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
    memberInfoApis: [
      "alipay.system.oauth.token",
      "alipay.user.info.share",
      "alipay.open.auth.userauth.relationship.query"
    ],
    setup: {
      zh: [
        "登录 open.alipay.com → 网页应用 VINCIS登录 → 开发信息",
        "「授权回调地址」填入 redirectUri（必须完全一致，https，无尾斜杠）",
        "可调用产品 → 会员 → 获取会员信息（已开通 alipay.user.info.share）",
        "应用公钥与部署环境 ALIPAY_PRIVATE_KEY 为同一对 RSA2 密钥",
        "ALIPAY_APP_ID 与控制台 AppID 一致（VINCIS登录）",
        "本地验证：npm run alipay:verify"
      ]
    },
    sampleAuthorizeUrl: config.sampleAuthorizeUrl,
    note: "Login button uses publicAppAuthorize (scope=auth_user). Context is stored in httpOnly cookie."
  });
}
