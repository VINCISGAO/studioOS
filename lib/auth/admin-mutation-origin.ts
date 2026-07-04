/** Same-origin guard for admin mutations — blocks cross-site requests even if cookies leak. */
export function validateAdminMutationOrigin(request: Request) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin")?.trim();
  const referer = request.headers.get("referer")?.trim();
  const secFetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();

  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    return false;
  }

  if (origin && origin !== expectedOrigin) {
    return false;
  }

  if (referer) {
    try {
      if (new URL(referer).origin !== expectedOrigin) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}
