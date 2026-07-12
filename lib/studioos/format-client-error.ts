function isDomEvent(value: unknown): value is Event {
  return typeof Event !== "undefined" && value instanceof Event;
}

function isNextNavigationError(error: Error): boolean {
  const digest = (error as Error & { digest?: string }).digest;
  return (
    error.message === "NEXT_REDIRECT" ||
    error.message === "NEXT_NOT_FOUND" ||
    (typeof digest === "string" && digest.startsWith("NEXT_"))
  );
}

/** Normalize unknown client-side failures into a user-facing string. */
export function formatClientError(caught: unknown, fallback: string): string {
  if (typeof caught === "string" && caught.trim()) {
    return caught;
  }

  if (caught instanceof Error) {
    if (isNextNavigationError(caught)) {
      return fallback;
    }
    return caught.message.trim() || fallback;
  }

  if (isDomEvent(caught)) {
    return fallback;
  }

  if (caught && typeof caught === "object") {
    const record = caught as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      const message = record.message.trim();
      if (message === "[object Event]") {
        return fallback;
      }
      return message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error.trim();
    }
  }

  const text = String(caught).trim();
  if (!text || text === "[object Event]" || text === "[object Object]") {
    return fallback;
  }

  return text;
}

export function coerceErrorMessage(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value.trim() === "[object Event]" ? fallback : value;
  }
  return formatClientError(value, fallback);
}
