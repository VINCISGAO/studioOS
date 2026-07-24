"use client";

import type { CanvasNodeData } from "@/lib/canvas/types";
import { VideoNodeCenterArt } from "@/components/canvas/nodes/video-node-center-art";
import { VideoNodeProgressRing } from "@/components/canvas/nodes/video-node-progress-ring";
import { VideoNodeSparkIcon } from "@/components/canvas/nodes/video-node-spark-icon";
import {
  normalizeVideoNodeProgress,
  VIDEO_NODE_LOADING_UI,
  videoNodeCopy
} from "@/lib/canvas/video-node-design";

export function VideoNodeGeneratingView({ data }: { data: CanvasNodeData }) {
  const t = videoNodeCopy.zh;
  const progress = normalizeVideoNodeProgress(data.progress);
  const ringId = `video-progress-${data.jobId ?? "node"}`;

  return (
    <>
      <div className={VIDEO_NODE_LOADING_UI.header}>
        <div className={VIDEO_NODE_LOADING_UI.headerMain}>
          <VideoNodeSparkIcon className={VIDEO_NODE_LOADING_UI.headerIcon} size={16} />
          <span className={VIDEO_NODE_LOADING_UI.headerTitle}>{t.title}</span>
        </div>
      </div>

      <div className={VIDEO_NODE_LOADING_UI.body}>
        <div className={VIDEO_NODE_LOADING_UI.ringWrap}>
          <VideoNodeProgressRing progress={progress} gradientId={ringId} />
          <div className={VIDEO_NODE_LOADING_UI.ringCenter}>
            <VideoNodeCenterArt />
          </div>
        </div>

        <h3 className={VIDEO_NODE_LOADING_UI.contentTitle}>{t.title}</h3>
        {data.prompt ? (
          <p className={VIDEO_NODE_LOADING_UI.contentPrompt}>{data.prompt}</p>
        ) : null}

        <div className={VIDEO_NODE_LOADING_UI.progressTrack}>
          <div
            className={VIDEO_NODE_LOADING_UI.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={VIDEO_NODE_LOADING_UI.progressLabel}>{t.generatingStatus(progress)}</p>
      </div>

      <div className={VIDEO_NODE_LOADING_UI.hintShell}>
        <VideoNodeSparkIcon className={VIDEO_NODE_LOADING_UI.hintIcon} size={14} />
        <span className={VIDEO_NODE_LOADING_UI.hintText}>{t.hint}</span>
      </div>
    </>
  );
}
