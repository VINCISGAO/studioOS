import "server-only";

function resolveAppOrigin() {
  const explicit = process.env.ADMIN_PASSKEY_ORIGIN?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getAdminPasskeyConfig() {
  const origin = resolveAppOrigin();
  const rpID =
    process.env.ADMIN_PASSKEY_RP_ID?.trim() ||
    new URL(origin).hostname ||
    "localhost";

  return {
    rpName: "VINCIS Admin",
    rpID,
    origin
  };
}
