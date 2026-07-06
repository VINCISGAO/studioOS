# Alipay OAuth Setup

This project uses Alipay Open Platform web OAuth for Alipay sign-in.

## Production URLs

- App domain: `https://vincis.app`
- App callback: `https://vincis.app/auth/alipay/callback`
- OAuth start endpoint: `https://vincis.app/api/auth/oauth/alipay?role=brand&lang=zh`
- Public config check: `https://vincis.app/api/alipay/oauth-config`

## Vercel Environment Variables

Set these in Vercel Production:

```env
NEXT_PUBLIC_APP_URL=https://vincis.app
VINCIS_ALIPAY_APP_ID=...
VINCIS_ALIPAY_PRIVATE_KEY=...
VINCIS_ALIPAY_REDIRECT_URI=https://vincis.app/auth/alipay/callback
VINCIS_ALIPAY_OAUTH_MODE=openauth
VINCIS_ALIPAY_SANDBOX=0
```

`VINCIS_ALIPAY_PRIVATE_KEY` must be the RSA2 private key that matches the application public key configured in Alipay Open Platform.

## Alipay Open Platform Configuration

In the Alipay Open Platform web app:

1. Confirm the app is online.
2. Confirm the app type is Web Application.
3. Confirm the member APIs are enabled:
   - `alipay.system.oauth.token`
   - `alipay.user.info.share`
4. In development settings, set the authorization callback URL exactly:
   - `https://vincis.app/auth/alipay/callback`
5. Confirm the application public key matches the private key stored in `VINCIS_ALIPAY_PRIVATE_KEY`.

## Verification

After redeploying Vercel, open:

```text
https://vincis.app/api/alipay/oauth-config
```

Expected result:

- `ok: true`
- `redirectUri: "https://vincis.app/auth/alipay/callback"`
- `authMode: "openauth"`
- `sandbox: false`

Then open:

```text
https://vincis.app/api/auth/oauth/alipay?role=brand&lang=zh
```

Expected result: Alipay authorization page opens. After authorization, the final redirect should land on the matching VINCIS portal.

