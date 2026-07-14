"use client";

import type { Editor } from "@tiptap/react";
import { useKnowledgeEditorImageUpload } from "@/hooks/use-knowledge-editor-image-upload";
import { KNOWLEDGE_ACCEPTED_IMAGE_ACCEPT } from "@/lib/knowledge/knowledge-upload-client";
import {
  knowledgeSetImageAlign,
  knowledgeSetImageWidth
} from "@/lib/knowledge/tiptap/knowledge-wysiwyg-commands";
import { ImagePlus } from "lucide-react";
import { useId, useRef } from "react";

type Props = {
  editor: Editor;
  zh: boolean;
  onNotify: (message: string, variant: "success" | "error" | "info") => void;
};

export function KnowledgeTiptapImageActions({ editor, zh, onNotify }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, upload } = useKnowledgeEditorImageUpload("inline", zh);
  const imageActive = editor.isActive("image");

  async function handleFile(file: File) {
    try {
      const result = await upload(file);
      editor
        .chain()
        .focus()
        .setImage({ src: result.url, alt: file.name })
        .updateAttributes("image", { align: "center", width: "100%" })
        .run();
      onNotify(zh ? "图片已插入" : "Image inserted", "success");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : zh ? "上传失败" : "Upload failed", "error");
    }
  }

  return (
    <>
      <button
        type="button"
        title={zh ? "插入图片" : "Insert image"}
        aria-label={zh ? "插入图片" : "Insert image"}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40"
      >
        <ImagePlus className="h-4 w-4" />
      </button>
      {imageActive ? (
        <>
          <button
            type="button"
            className="rounded-md px-1.5 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100"
            onClick={() => knowledgeSetImageAlign(editor, "left")}
          >
            {zh ? "左" : "L"}
          </button>
          <button
            type="button"
            className="rounded-md px-1.5 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100"
            onClick={() => knowledgeSetImageAlign(editor, "center")}
          >
            {zh ? "中" : "C"}
          </button>
          <button
            type="button"
            className="rounded-md px-1.5 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100"
            onClick={() => knowledgeSetImageAlign(editor, "right")}
          >
            {zh ? "右" : "R"}
          </button>
          <button
            type="button"
            className="rounded-md px-1.5 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100"
            onClick={() => knowledgeSetImageWidth(editor, "50%")}
          >
            50%
          </button>
          <button
            type="button"
            className="rounded-md px-1.5 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100"
            onClick={() => knowledgeSetImageWidth(editor, "100%")}
          >
            100%
          </button>
        </>
      ) : null}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={KNOWLEDGE_ACCEPTED_IMAGE_ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.currentTarget.value = "";
        }}
      />
    </>
  );
}
