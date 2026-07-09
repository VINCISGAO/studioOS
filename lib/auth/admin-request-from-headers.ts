import "server-only";

import { headers } from "next/headers";
import { getAppBaseUrl } from "@/lib/app-url";

function resolveForwardedSiteOrigin(headerList: Headers) {
  const forwardedHost = headerList.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = headerList.get("host")?.split(",")[0]?.trim();
  if (host) {
    const proto = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${proto}://${host}`;
  }

  return getAppBaseUrl();
}

/** Build a Request from the current RSC / Server Action incoming headers (for admin IP/UA context). */
export async function adminRequestFromHeaders(pathname = "/admin") {
  const headerList = await headers();
  const requestHeaders = new Headers();
  headerList.forEach((value, key) => {
    requestHeaders.append(key, value);
  });

  const siteOrigin = resolveForwardedSiteOrigin(requestHeaders);
  if (!requestHeaders.get("origin")) {
    requestHeaders.set("origin", siteOrigin);
  }
  if (!requestHeaders.get("referer")) {
    requestHeaders.set("referer", `${siteOrigin}${pathname}`);
  }

  return new Request(`${siteOrigin}${pathname}`, { headers: requestHeaders });
}
