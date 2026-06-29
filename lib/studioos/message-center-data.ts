/**
 * Client-safe compatibility module.
 * Do NOT import server-only stores (fs) here — webpack will bundle this for the client
 * if anything in the client graph imports from this file.
 */
import type { Locale } from "@/lib/i18n";

export type {
  BriefField,
  MessageAttachment,
  MessageDetailPayload,
  MessageListItem,
  MessageNotificationType,
  ProgressStep
} from "@/components/studioos/studio-message-center.types";

export function formatMessageTime(iso: string, locale: Locale) {
  const date = new Date(iso);
  const now = Date.now();
  const diffMin = Math.floor((now - date.getTime()) / 60000);
  if (diffMin < 1) return locale === "zh" ? "刚刚" : "Just now";
  if (diffMin < 60) return locale === "zh" ? `${diffMin} 分钟前` : `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return locale === "zh" ? `${diffHours} 小时前` : `${diffHours}h ago`;
  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
