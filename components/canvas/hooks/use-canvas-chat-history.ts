"use client";

import { useCallback, useEffect, useState } from "react";

export type CanvasChatHistoryMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  answerMode?: string;
  imageUrl?: string;
  referenceImageUrl?: string;
  assetId?: string;
  createdAt?: string;
  feedback?: {
    rating: "HELPFUL" | "NOT_HELPFUL";
    createdAt?: string;
  } | null;
};

type HistoryResponse = {
  sessionId: string | null;
  title?: string | null;
  memoryHours: number;
  expiresAt: string | null;
  messages: CanvasChatHistoryMessage[];
};

function storageKey(projectId: string) {
  return `vincis:canvas-chat:${projectId}`;
}

function writeStoredSessionId(projectId: string, sessionId: string | null) {
  try {
    if (sessionId) sessionStorage.setItem(storageKey(projectId), sessionId);
    else sessionStorage.removeItem(storageKey(projectId));
  } catch {
    // ignore
  }
}

export function useCanvasChatHistory(projectId: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CanvasChatHistoryMessage[]>([]);
  const [memoryHours, setMemoryHours] = useState(12);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/canvas/chat?projectId=${encodeURIComponent(projectId)}`);
      const payload = (await response.json()) as {
        success: boolean;
        data?: HistoryResponse;
        error?: { message?: string };
      };
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "Failed to load chat history");
      }
      setSessionId(payload.data.sessionId);
      setMessages(payload.data.messages);
      setMemoryHours(payload.data.memoryHours);
      setExpiresAt(payload.data.expiresAt);
      writeStoredSessionId(projectId, payload.data.sessionId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load chat history");
      setSessionId(null);
      setMessages([]);
      setExpiresAt(null);
      writeStoredSessionId(projectId, null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  async function resetSession() {
    if (sessionId) {
      await fetch(
        `/api/canvas/chat?projectId=${encodeURIComponent(projectId)}&sessionId=${encodeURIComponent(sessionId)}`,
        { method: "DELETE" }
      );
    }
    setSessionId(null);
    setMessages([]);
    setExpiresAt(null);
    writeStoredSessionId(projectId, null);
  }

  const updateSessionId = useCallback(
    (next: string | null) => {
      setSessionId(next);
      writeStoredSessionId(projectId, next);
    },
    [projectId]
  );

  return {
    sessionId,
    setSessionId: updateSessionId,
    messages,
    setMessages,
    memoryHours,
    expiresAt,
    loading,
    error,
    loadHistory,
    resetSession
  };
}
