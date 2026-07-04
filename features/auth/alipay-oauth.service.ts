import "server-only";

import {
  alipayOAuthRedirectUri,
  getAlipayOAuthConfig,
  hasAlipayOAuthConfig
} from "@/lib/alipay/alipay-oauth-config";
import { callAlipayOpenApi } from "@/lib/alipay/alipay-openapi.client";
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

  buildAuthorizeUrl(statePayload: OAuthStatePayload) {
    const config = getAlipayOAuthConfig();
    if (!config) {
      throw new Error("Alipay OAuth is not configured");
    }

    const redirectUri = encodeURIComponent(alipayOAuthRedirectUri());
    const state = encodeURIComponent(encodeAlipayOAuthState(statePayload));
    return `${config.authBaseUrl}/oauth2/publicAppAuthorize.htm?app_id=${config.appId}&scope=auth_user&redirect_uri=${redirectUri}&state=${state}`;
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
    }>(tokenJson, "alipay_system_oauth_token_response");

    const accessToken = tokenResponse?.access_token;
    const userId = tokenResponse?.user_id;
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
    }>(profileJson, "alipay_user_info_share_response");

    return {
      userId,
      nickName: profileResponse?.nick_name?.trim() || `Alipay用户${userId.slice(-4)}`,
      avatar: profileResponse?.avatar,
      email: profileResponse?.email?.trim() || undefined
    };
  }
}

export const alipayOAuthService = new AlipayOAuthService();
