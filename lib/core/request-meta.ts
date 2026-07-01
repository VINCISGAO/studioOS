/** Request metadata for activity logs — safe outside Next.js request scope (verify scripts). */
export async function readRequestMeta(): Promise<{ ip: string | null; device: string | null }> {
  if (process.env.STUDIOOS_SCRIPT_RUNTIME === "verify") {
    return { ip: "127.0.0.1", device: "studioos-verify-script" };
  }

  try {
    const { headers } = await import("next/headers");
    const headerList = await headers();
    return {
      ip:
        headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        headerList.get("x-real-ip") ??
        null,
      device: headerList.get("user-agent")
    };
  } catch {
    return { ip: null, device: null };
  }
}
