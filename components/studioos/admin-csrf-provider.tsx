"use client";

import { useEffect } from "react";
import { setAdminCsrfToken } from "@/lib/studioos/admin-csrf-client";

export function AdminCsrfProvider({
  token,
  children
}: {
  token: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    setAdminCsrfToken(token);
    return () => setAdminCsrfToken(null);
  }, [token]);

  return children;
}
