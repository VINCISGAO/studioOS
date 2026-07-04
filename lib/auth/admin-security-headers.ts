import { NextResponse } from "next/server";

type AdminSecurityHeaderOptions = {
  nonce?: string;
  production?: boolean;
};

/** Defense-in-depth headers for admin portal pages and APIs. */
export function applyAdminSecurityHeaders(
  response: NextResponse,
  options: AdminSecurityHeaderOptions = {}
) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  const scriptSrc = options.nonce
    ? `'self' 'nonce-${options.nonce}' 'strict-dynamic'`
    : "'self' 'unsafe-inline' 'unsafe-eval'";

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];

  if (options.production) {
    directives.push("upgrade-insecure-requests");
  }

  response.headers.set("Content-Security-Policy", directives.join("; "));
  return response;
}

export function isAdminSurfacePath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/v1/admin/")
  );
}

export function generateAdminCspNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
