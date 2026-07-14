"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";

type SharedProps = {
  value: string;
  onValueChange: (value: string) => void;
  onDraftChange?: (value: string) => void;
};

function useImeDraft(value: string, onValueChange: (value: string) => void, onDraftChange?: (value: string) => void) {
  const [draft, setDraft] = useState(value);
  const composingRef = useRef(false);

  useEffect(() => {
    if (!composingRef.current) {
      setDraft(value);
      onDraftChange?.(value);
    }
  }, [onDraftChange, value]);

  const syncDraft = (next: string) => {
    setDraft(next);
    onDraftChange?.(next);
  };

  const handleChange = (next: string) => {
    syncDraft(next);
    if (!composingRef.current) {
      onValueChange(next);
    }
  };

  const commit = (next: string) => {
    syncDraft(next);
    onValueChange(next);
  };

  const handleBlur = (next: string) => {
    if (composingRef.current) {
      composingRef.current = false;
    }
    commit(next);
  };

  return {
    draft,
    composingRef,
    commit,
    handleChange,
    handleBlur
  };
}

export function KnowledgeImeInput({
  value,
  onValueChange,
  onDraftChange,
  ...props
}: SharedProps & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "defaultValue">) {
  const { draft, composingRef, commit, handleChange, handleBlur } = useImeDraft(value, onValueChange, onDraftChange);

  return (
    <Input
      {...props}
      value={draft}
      autoComplete="off"
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={(event) => {
        composingRef.current = false;
        commit(event.currentTarget.value);
      }}
      onBlur={(event) => handleBlur(event.currentTarget.value)}
      onChange={(event) => handleChange(event.target.value)}
      onInput={(event) => handleChange(event.currentTarget.value)}
    />
  );
}

export function KnowledgeImeTextarea({
  value,
  onValueChange,
  onDraftChange,
  ...props
}: SharedProps & Omit<React.ComponentProps<typeof Textarea>, "value" | "onChange" | "defaultValue">) {
  const { draft, composingRef, commit, handleChange, handleBlur } = useImeDraft(value, onValueChange, onDraftChange);

  return (
    <Textarea
      {...props}
      value={draft}
      autoComplete="off"
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={(event) => {
        composingRef.current = false;
        commit(event.currentTarget.value);
      }}
      onBlur={(event) => handleBlur(event.currentTarget.value)}
      onChange={(event) => handleChange(event.target.value)}
      onInput={(event) => handleChange(event.currentTarget.value)}
    />
  );
}
