# Google OAuth Setup

This project uses Supabase Auth as the OAuth broker for Google sign-in.

## Production URLs

- App domain: `https://vincis.app`
- App callback: `https://vincis.app/auth/callback`
- Supabase project host: `https://nvggsbwecmykdleepgsr.supabase.co`
- Google authorized redirect URI: `https://nvggsbwecmykdleepgsr.supabase.co/auth/v1/callback`

## Vercel Environment Variables

Set these in Vercel Production:

```env
NEXT_PUBLIC_SUPABASE_URL=https://nvggsbwecmykdleepgsr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
VINCIS_APP_URL=https://vincis.app
NEXT_PUBLIC_APP_URL=https://vincis.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
VINCIS_FORCE_SUPABASE_AUTH=1
VINCIS_DEMO_AUTH=0
```

`VINCIS_FORCE_SUPABASE_AUTH=1` ensures the production login page exposes real OAuth instead of demo social shortcuts.
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` is the Google OAuth Web Client ID. It is public and is required for Google One Tap.

## Supabase Auth Configuration

In Supabase Dashboard:

1. Go to Authentication -> URL Configuration.
2. Set Site URL to `https://vincis.app`.
3. Add Redirect URLs:
   - `https://vincis.app/auth/callback`
   - `http://localhost:3000/auth/callback` for local development
4. Remove any old production callback or site URL pointing to `studio-os-sigma.vercel.app`.
5. Go to Authentication -> Providers -> Google.
6. Enable Google.
7. Paste the Google OAuth Client ID and Client Secret.

## Google Cloud Console Configuration

In Google Cloud Console:

1. Open APIs & Services -> Credentials.
2. Create or edit the OAuth 2.0 Client ID.
3. Authorized JavaScript origins:
   - `https://vincis.app`
   - `http://localhost:3000`
4. Authorized redirect URIs:
   - `https://nvggsbwecmykdleepgsr.supabase.co/auth/v1/callback`

Do not put `https://vincis.app/auth/callback` into Google as the primary redirect URI. Google returns to Supabase first, then Supabase redirects back to the app.

## Verification

Open:

```text
https://vincis.app/api/auth/oauth/google?role=brand&lang=zh
```

Expected result: Google sign-in page opens and shows it will continue to `nvggsbwecmykdleepgsr.supabase.co`.

After completing Google login, the final redirect should land on:

- Brand entry: `https://vincis.app/brand?lang=zh`
- Creator entry: `https://vincis.app/studio?lang=zh`

## Google One Tap Verification

After deployment, open:

```text
https://vincis.app/login?role=brand&lang=zh
```

Expected result: if the browser has an eligible Google account and One Tap has not been dismissed too often, Google's One Tap prompt appears on the login page. Completing it should redirect to the same destination as normal Google OAuth.

