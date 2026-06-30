export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export const DEMO_SESSION_COOKIE = "studioos_demo_session";
export const LOCALE_COOKIE = "studioos_lang";
export const VISITOR_COOKIE = "studioos_visitor_id";
export const INQUIRY_BOOTSTRAP_COOKIE = "studioos_inquiry_bootstrap";
