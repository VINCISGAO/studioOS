let csrfToken: string | null = null;

export function setAdminCsrfToken(token: string | null) {
  csrfToken = token;
  if (typeof document !== "undefined") {
    const bootstrap = document.getElementById("admin-csrf-bootstrap");
    if (bootstrap) {
      if (token) bootstrap.setAttribute("data-csrf", token);
      else bootstrap.removeAttribute("data-csrf");
    }
  }
}

export function readAdminCsrfToken(): string | null {
  if (csrfToken) return csrfToken;
  if (typeof document === "undefined") return null;
  const bootstrap = document.getElementById("admin-csrf-bootstrap");
  const fromDom = bootstrap?.getAttribute("data-csrf")?.trim();
  return fromDom || null;
}

export function adminMutationHeaders(): HeadersInit {
  const csrf = readAdminCsrfToken();
  return csrf ? { "X-Admin-CSRF": csrf } : {};
}
