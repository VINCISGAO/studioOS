"use client";

import { readAdminCsrfToken } from "@/lib/studioos/admin-csrf-client";

/** Hidden CSRF field for admin Server Action forms. */
export function AdminFormCsrf() {
  const token = readAdminCsrfToken();
  if (!token) return null;
  return <input type="hidden" name="_adminCsrf" value={token} readOnly />;
}
