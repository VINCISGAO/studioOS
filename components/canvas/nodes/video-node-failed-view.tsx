"use client";

import { AlertCircle } from "lucide-react";
import type { CanvasNodeData } from "@/lib/canvas/types";
import { formatValidationMessage } from "@/lib/canvas/format-validation-message";
import { VIDEO_NODE_LOADING_UI, videoNodeCopy } from "@/lib/canvas/video-node-design";

export function VideoNodeFailedView({ data }: { data: CanvasNodeData }) {
  const t = videoNodeCopy.zh;
  const errorMessage = data.error ? formatValidationMessage(data.error) : "视频生成失败，请稍后重试";

  return (
    <>
      <div className={VIDEO_NODE_LOADING_UI.header}>
        <div className={VIDEO_NODE_LOADING_UI.headerMain}>
          <AlertCircle className="h-4 w-4 text-rose-500" />
          <span className={VIDEO_NODE_LOADING_UI.headerTitle}>{t.title}</span>
        </div>
      </div>

      <div className={VIDEO_NODE_LOADING_UI.body}>
        <div className="flex min-h-[120px] w-full max-w-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-rose-50/80 px-4 py-5 text-center">
          <p className="text-[13px] font-medium text-rose-700">生成失败</p>
          <p className="mt-2 text-[12px] leading-5 text-rose-600">{errorMessage}</p>
        </div>
        {data.prompt ? (
          <p className={VIDEO_NODE_LOADING_UI.contentPrompt}>{data.prompt}</p>
        ) : null}
      </div>
    </>
  );
}
