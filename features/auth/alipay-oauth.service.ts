import "server-only";

import {
  alipayOAuthMode,
  alipayOAuthRedirectUri,
  buildAlipayPublicAuthorizeUrl,
  getAlipayOAuthConfig,
  hasAlipayOAuthConfig
} from "@/lib/alipay/alipay-oauth-config";
import { buildAlipaySignedGatewayUrl, callAlipayOpenApi } from "@/lib/alipay/alipay-openapi.client";
import { encodeAlipayOAuthState, type OAuthStatePayload } from "@/features/auth/oauth-state";

export type AlipayOAuthProfile = {
  userId: string;
  nickName: string;
  avatar?: string;
  email?: string;
};

function readResponseNode<T extends Record<string, unknown>>(json: Record<string, unknown>, key: string) {
  const node = json[key];
  return node && typeof node === "object" ? (node as T) : null;
}

export class AlipayOAuthService {
  isConfigured() {
    return hasAlipayOAuthConfig();
  }

  /** Openauth mode never puts `state` in the URL — Alipay rejects it; context is stored in a cookie. */
  buildAuthorizeUrl(statePayload?: OAuthStatePayload) {
    const config = getAlipayOAuthConfig();
    if (!config) {
      throw new Error("Alipay OAuth is not configured");
    }

    const redirectUri = alipayOAuthRedirectUri();

    if (alipayOAuthMode() === "gateway") {
      const state = statePayload ? encodeAlipayOAuthState(statePayload) : "";
      return buildAlipaySignedGatewayUrl({
        gatewayUrl: config.gatewayUrl,
        appId: config.appId,
        privateKey: config.privateKey,
        method: "alipay.user.info.auth",
        params: { return_url: redirectUri },
        bizContent: {
          scopes: ["auth_user"],
          ...(state ? { state } : {})
        }
      });
    }

    return buildAlipayPublicAuthorizeUrl(config, redirectUri);
  }

  async exchangeAuthCode(authCode: string): Promise<AlipayOAuthProfile> {
    const config = getAlipayOAuthConfig();
    if (!config) {
      throw new Error("Alipay OAuth is not configured");
    }

    const tokenJson = await callAlipayOpenApi({
      gatewayUrl: config.gatewayUrl,
      appId: config.appId,
      privateKey: config.privateKey,
      method: "alipay.system.oauth.token",
      params: {
        grant_type: "authorization_code",
        code: authCode
      }
    });

    const tokenResponse = readResponseNode<{
      access_token?: string;
      user_id?: string;
      open_id?: string;
    }>(tokenJson, "alipay_system_oauth_token_response");

    const accessToken = tokenResponse?.access_token;
    const userId = tokenResponse?.user_id ?? tokenResponse?.open_id;
    if (!accessToken || !userId) {
      throw new Error("Alipay did not return an access token");
    }

    const profileJson = await callAlipayOpenApi({
      gatewayUrl: config.gatewayUrl,
      appId: config.appId,
      privateKey: config.privateKey,
      method: "alipay.user.info.share",
      bizContent: {
        auth_token: accessToken
      }
    });

    const profileResponse = readResponseNode<{
      nick_name?: string;
      avatar?: string;
      email?: string;
      user_id?: string;
    }>(profileJson, "alipay_user_info_share_response");

    const resolvedUserId = profileResponse?.user_id ?? userId;

    return {
      userId: resolvedUserId,
      nickName: profileResponse?.nick_name?.trim() || `Alipay用户${resolvedUserId.slice(-4)}`,
      avatar: profileResponse?.avatar,
      email: profileResponse?.email?.trim() || undefined
    };
  }
}

export const alipayOAuthService = new AlipayOAuthService();
