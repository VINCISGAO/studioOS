export const LUCIEN_CHAT_IDLE_MS = 2 * 60 * 60 * 1000;

export type LucienChatSurface = "public" | "workspace";

export type LucienStoredMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  feedback?: {
    rating: "HELPFUL" | "NOT_HELPFUL";
    reason?: string | null;
    createdAt: string;
  } | null;
};

export type LucienChatRecord = {
  messages: LucienStoredMessage[];
  suggestions: string[];
  sessionId?: string | null;
  lastActivityAt: number;
};

let lastKnownAuthUserId: string | null = null;

function guestStorageKey(surface: LucienChatSurface) {
  return `vincis-lucien-chat:${surface}:guest`;
}

function authStorageKey(surface: LucienChatSurface, userId: string) {
  return `vincis-lucien-chat:${surface}:${userId}`;
}

function isExpired(lastActivityAt: number) {
  return Date.now() - lastActivityAt > LUCIEN_CHAT_IDLE_MS;
}

function parseRecord(raw: string | null): LucienChatRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LucienChatRecord>;
    if (!Array.isArray(parsed.messages) || typeof parsed.lastActivityAt !== "number") {
      return null;
    }
    return {
      messages: parsed.messages.filter(
        (line): line is LucienStoredMessage =>
          Boolean(line) &&
          typeof line.id === "string" &&
          (line.role === "USER" || line.role === "ASSISTANT") &&
          typeof line.content === "string"
      ),
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.filter((item): item is string => typeof item === "string")
        : [],
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : null,
      lastActivityAt: parsed.lastActivityAt
    };
  } catch {
    return null;
  }
}

export function syncLucienChatAuthUser(userId: string | null) {
  if (lastKnownAuthUserId && userId !== lastKnownAuthUserId) {
    clearAuthLucienChat(lastKnownAuthUserId, "public");
    clearAuthLucienChat(lastKnownAuthUserId, "workspace");
  }
  lastKnownAuthUserId = userId;
}

export function readGuestLucienChat(surface: LucienChatSurface): LucienChatRecord | null {
  if (typeof window === "undefined") return null;
  return parseRecord(window.sessionStorage.getItem(guestStorageKey(surface)));
}

export function writeGuestLucienChat(surface: LucienChatSurface, record: LucienChatRecord) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(guestStorageKey(surface), JSON.stringify(record));
}

export function clearGuestLucienChat(surface: LucienChatSurface) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(guestStorageKey(surface));
}

export function readAuthLucienChat(userId: string, surface: LucienChatSurface): LucienChatRecord | null {
  if (typeof window === "undefined") return null;
  const record = parseRecord(window.localStorage.getItem(authStorageKey(surface, userId)));
  if (!record) return null;
  if (isExpired(record.lastActivityAt)) {
    window.localStorage.removeItem(authStorageKey(surface, userId));
    return null;
  }
  return record;
}

export function writeAuthLucienChat(
  userId: string,
  surface: LucienChatSurface,
  record: LucienChatRecord
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    authStorageKey(surface, userId),
    JSON.stringify({ ...record, lastActivityAt: Date.now() })
  );
}

export function clearAuthLucienChat(userId: string, surface: LucienChatSurface) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(authStorageKey(surface, userId));
}

export function touchAuthLucienChatActivity(userId: string, surface: LucienChatSurface) {
  const record = readAuthLucienChat(userId, surface);
  if (!record) return;
  writeAuthLucienChat(userId, surface, record);
}

export function installAuthLucienChatIdleGuard(
  userId: string,
  surface: LucienChatSurface,
  onExpired: () => void
) {
  if (typeof window === "undefined") return () => undefined;

  let lastTouchAt = 0;
  const touch = () => {
    const now = Date.now();
    if (now - lastTouchAt < 30_000) return;
    lastTouchAt = now;
    const record = readAuthLucienChat(userId, surface);
    if (!record) return;
    if (isExpired(record.lastActivityAt)) {
      clearAuthLucienChat(userId, surface);
      onExpired();
      return;
    }
    writeAuthLucienChat(userId, surface, record);
  };

  const events = ["mousedown", "keydown", "scroll", "touchstart"] as const;
  for (const eventName of events) {
    window.addEventListener(eventName, touch, { passive: true });
  }

  const interval = window.setInterval(() => {
    const record = readAuthLucienChat(userId, surface);
    if (!record) return;
    if (isExpired(record.lastActivityAt)) {
      clearAuthLucienChat(userId, surface);
      onExpired();
    }
  }, 60_000);

  return () => {
    for (const eventName of events) {
      window.removeEventListener(eventName, touch);
    }
    window.clearInterval(interval);
  };
}
