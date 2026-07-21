export const CANVAS_CHAT_MEMORY_HOURS = 12;
export const CANVAS_CHAT_MEMORY_MS = CANVAS_CHAT_MEMORY_HOURS * 60 * 60 * 1000;

export function canvasChatMemorySince(now = Date.now()) {
  return new Date(now - CANVAS_CHAT_MEMORY_MS);
}

export function canvasChatMemoryExpiresAt(updatedAt: Date) {
  return new Date(updatedAt.getTime() + CANVAS_CHAT_MEMORY_MS);
}
