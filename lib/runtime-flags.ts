/** Edge/middleware-safe flags — no Node built-ins or server-only imports. */

export function canPersistLocalDataStore() {
  return process.env.VERCEL !== "1";
}

/** Demo auth works on Vercel even if Supabase env keys are present (not wired for brand portal yet). */
export function preferDemoAuth() {
  return process.env.STUDIOOS_FORCE_SUPABASE_AUTH !== "1";
}

/** Show demo accounts + social shortcuts on the login page. */
export function isDemoLoginUiEnabled() {
  return preferDemoAuth();
}
