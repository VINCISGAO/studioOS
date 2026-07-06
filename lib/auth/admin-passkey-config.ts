import "server-only";

import { getAppBaseUrl } from "@/lib/app-url";

function resolveAppOrigin() {
  const explicit =
    process.env.ADMIN_PASSKEY_ORIGIN?.trim() ||
    process.env.VINCIS_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return getAppBaseUrl();
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
