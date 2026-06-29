export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export const DEMO_SESSION_COOKIE = "adbridge_demo_session";
export const LOCALE_COOKIE = "adbridge_lang";
export const VISITOR_COOKIE = "adbridge_visitor_id";
export const INQUIRY_BOOTSTRAP_COOKIE = "adbridge_inquiry_bootstrap";
