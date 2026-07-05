import { NextResponse } from "next/server";
import { alipayOAuthService } from "@/features/auth/alipay-oauth.service";
import { authSecurityService } from "@/features/auth/auth-security.service";
import {
  completeAlipaySignIn,
  oauthFailureRedirect
} from "@/features/auth/oauth-auth.service";
import { consumeAlipayOAuthState } from "@/features/auth/oauth-state";
import { attachDemoSessionCookie } from "@/lib/demo-auth-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const authCode = requestUrl.searchParams.get("auth_code");
  const state = await consumeAlipayOAuthState(requestUrl.searchParams.get("state"));
  const entryRole = state?.entryRole ?? "brand";
  const lang = state?.lang ?? "zh";
  const nextPath = state?.nextPath ?? "";

  if (!authCode) {
    const oauthError =
      requestUrl.searchParams.get("error_description") ??
      requestUrl.searchParams.get("error") ??
      "支付宝授权已取消";
    return NextResponse.redirect(new URL(oauthFailureRedirect(oauthError, entryRole, lang), request.url));
  }

  if (!state) {
    return NextResponse.redirect(
      new URL(
        oauthFailureRedirect(
          "支付宝登录会话已过期，请从登录页重新点击支付宝图标（不要直接打开授权链接）。",
          entryRole,
          lang
        ),
        request.url
      )
    );
  }

  try {
    const profile = await alipayOAuthService.exchangeAuthCode(authCode);
    const { redirectTo, userId, email, demoSession } = await completeAlipaySignIn({
      providerUserId: profile.userId,
      nickName: profile.nickName,
      email: profile.email,
      avatar: profile.avatar,
      entryRole,
      lang,
      nextPath
    });

    await authSecurityService.recordOAuthCallback({
      request,
      provider: "alipay",
      success: true,
      email,
      userId
    });

    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    attachDemoSessionCookie(response, demoSession);
    return response;
  } catch (error) {
    await authSecurityService.recordOAuthCallback({
      request,
      provider: "alipay",
      success: false
    });

    const raw = error instanceof Error ? error.message : "支付宝登录失败，请稍后再试。";
    const message = raw.includes("invalid-signature") || raw.includes("验签")
      ? "支付宝应用密钥不匹配，请检查网页应用 StudioOS登录 的应用公钥与 Vercel 私钥是否为同一对。"
      : raw.includes("AUTH_REDIRECT") || raw.includes("redirect")
        ? "支付宝授权回调地址不匹配，请在开放平台开发设置中填写 https://studio-os-sigma.vercel.app/auth/alipay/callback"
        : raw;
    return NextResponse.redirect(new URL(oauthFailureRedirect(message, entryRole, lang), request.url));
  }
}
