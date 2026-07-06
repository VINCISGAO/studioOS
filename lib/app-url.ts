/** Public site URL for emails, notifications, OAuth redirects, and server-side links. */
export function getAppBaseUrl() {
  const configured = process.env.VINCIS_APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    return "https://vincis.app";
  }

  return "http://localhost:3000";
}
