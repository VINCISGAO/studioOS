import "server-only";

import { headers } from "next/headers";

/** Build a Request from the current RSC / Server Action incoming headers (for admin IP/UA context). */
export async function adminRequestFromHeaders(pathname = "/admin") {
  const headerList = await headers();
  const requestHeaders = new Headers();
  headerList.forEach((value, key) => {
    requestHeaders.append(key, value);
  });
  return new Request(`https://studioos.local${pathname}`, { headers: requestHeaders });
}
