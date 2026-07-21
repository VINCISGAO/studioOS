import { CANVAS_CHAT_MEMORY_HOURS } from "@/lib/canvas/chat-memory";

type MessageMetadata = {
  answerMode?: string;
  imageUrl?: string;
  assetId?: string;
  referenceAssetId?: string;
  entityId?: string;
  entityType?: string;
  feedback?: {
    rating: "HELPFUL" | "NOT_HELPFUL";
    createdAt?: string;
  };
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function parseCanvasChatMetadata(metadataJson: unknown): MessageMetadata {
  const meta = asRecord(metadataJson);
  const feedbackRaw = asRecord(meta.feedback);
  const rating = feedbackRaw.rating;
  return {
    answerMode: typeof meta.answerMode === "string" ? meta.answerMode : undefined,
    imageUrl: typeof meta.imageUrl === "string" ? meta.imageUrl : undefined,
    assetId: typeof meta.assetId === "string" ? meta.assetId : undefined,
    referenceAssetId:
      typeof meta.referenceAssetId === "string" ? meta.referenceAssetId : undefined,
    entityId: typeof meta.entityId === "string" ? meta.entityId : undefined,
    entityType: typeof meta.entityType === "string" ? meta.entityType : undefined,
    feedback:
      rating === "HELPFUL" || rating === "NOT_HELPFUL"
        ? {
            rating,
            createdAt:
              typeof feedbackRaw.createdAt === "string" ? feedbackRaw.createdAt : undefined
          }
        : undefined
  };
}

export function serializeCanvasChatMessage(message: {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  metadataJson: unknown;
}) {
  const meta = parseCanvasChatMetadata(message.metadataJson);
  const role = message.role === "ASSISTANT" ? "assistant" : "user";
  const referenceAssetId = meta.referenceAssetId;
  return {
    id: message.id,
    role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    answerMode: meta.answerMode,
    imageUrl: meta.imageUrl,
    assetId: meta.assetId,
    referenceImageUrl: referenceAssetId
      ? `/api/canvas/assets/${referenceAssetId}/preview`
      : undefined,
    feedback: meta.feedback ?? null
  };
}

export function formatCanvasChatHistoryForModel(
  messages: Array<{ role: string; content: string }>,
  locale: "zh" | "en"
) {
  const recent = messages
    .filter((message) => message.role === "USER" || message.role === "ASSISTANT")
    .slice(-20);
  if (recent.length === 0) return "";

  const userLabel = locale === "zh" ? "用户" : "User";
  const assistantLabel = locale === "zh" ? "助手" : "Assistant";
  const header =
    locale === "zh"
      ? `以下是过去 ${CANVAS_CHAT_MEMORY_HOURS} 小时内的画布对话记录，请结合上下文回答。`
      : `Canvas conversation from the last ${CANVAS_CHAT_MEMORY_HOURS} hours. Use this context in your answer.`;

  const body = recent
    .map((message) => {
      const label = message.role === "USER" ? userLabel : assistantLabel;
      return `${label}: ${message.content.trim()}`;
    })
    .join("\n");

  return `${header}\n${body}`;
}
