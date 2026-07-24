export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Legacy demo session cookie name — keep value until a dual-read migration ships. */
export const SESSION_COOKIE_NAME = "studioos_demo_session";
/** @deprecated Prefer SESSION_COOKIE_NAME for new auth code. */
export const DEMO_SESSION_COOKIE = SESSION_COOKIE_NAME;
export const ADMIN_SESSION_COOKIE = "studioos_admin_session";
export const ADMIN_CSRF_COOKIE = "studioos_admin_csrf";
export const ADMIN_SESSION_MAX_AGE_SEC = 2 * 60 * 60;
export const LOCALE_COOKIE = "studioos_lang";
export const VISITOR_COOKIE = "studioos_visitor_id";
export const INQUIRY_BOOTSTRAP_COOKIE = "studioos_inquiry_bootstrap";
