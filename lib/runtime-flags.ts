/** Edge/middleware-safe flags — no Node built-ins or server-only imports. */

export function canPersistLocalDataStore() {
  return process.env.VERCEL !== "1";
}

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Prefer demo/password shortcuts over Supabase session in middleware. */
export function preferDemoAuth() {
  if (
    process.env.VINCIS_FORCE_SUPABASE_AUTH === "1" ||
    process.env.STUDIOOS_FORCE_SUPABASE_AUTH === "1"
  ) {
    return false;
  }
  if (process.env.VINCIS_DEMO_AUTH === "1" || process.env.STUDIOOS_DEMO_AUTH === "1") {
    return true;
  }
  // Vercel + Supabase → real auth (Google OAuth, email codes, DB users).
  if (process.env.VERCEL === "1" && hasSupabaseEnv()) return false;
  return process.env.NODE_ENV !== "production";
}

/** Show demo accounts + social shortcuts on the login page. */
export function isDemoLoginUiEnabled() {
  return preferDemoAuth();
}
