/** Resolve a human-readable location label from an IP address. */
export async function resolveGeoLocation(
  ip: string,
  fallbackCountry?: string
): Promise<string> {
  const normalized = ip.trim();
  const isPrivate =
    !normalized ||
    normalized === "unknown" ||
    normalized.startsWith("127.") ||
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    normalized === "::1";

  if (isPrivate) {
    return defaultLocationForCountry(fallbackCountry);
  }

  try {
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(normalized)}?fields=status,city,country`,
      { next: { revalidate: 60 * 60 * 24 } }
    );
    if (response.ok) {
      const data = (await response.json()) as {
        status?: string;
        city?: string;
        country?: string;
      };
      if (data.status === "success" && data.city && data.country) {
        return `${data.city}, ${data.country}`;
      }
    }
  } catch {
    // fall through to country default
  }

  return defaultLocationForCountry(fallbackCountry);
}

function defaultLocationForCountry(country?: string) {
  if (country === "South Korea") {
    return "Seoul, South Korea";
  }
  if (country === "Spain") {
    return "Madrid, Spain";
  }
  if (country === "United States") {
    return "San Francisco, United States";
  }
  return "Local network";
}
