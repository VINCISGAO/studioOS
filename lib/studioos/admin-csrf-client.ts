let csrfToken: string | null = null;

export function setAdminCsrfToken(token: string | null) {
  csrfToken = token;
}

export function readAdminCsrfToken(): string | null {
  return csrfToken;
}

export function adminMutationHeaders(): HeadersInit {
  const csrf = readAdminCsrfToken();
  return csrf ? { "X-Admin-CSRF": csrf } : {};
}
