"use client";

import { useCallback, useState } from "react";

export type KnowledgeEditorToastTone = "info" | "error" | "success";

export type KnowledgeEditorToast = {
  text: string;
  tone: KnowledgeEditorToastTone;
};

export function useKnowledgeEditorToast() {
  const [message, setMessage] = useState<KnowledgeEditorToast | null>(null);

  const notify = useCallback((text: string, tone: KnowledgeEditorToastTone) => {
    setMessage({ text, tone });
  }, []);

  const clear = useCallback(() => setMessage(null), []);

  return { message, notify, clear };
}
