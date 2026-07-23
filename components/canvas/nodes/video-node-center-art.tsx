"use client";

import { VideoNodeSparkIcon } from "@/components/canvas/nodes/video-node-spark-icon";

export function VideoNodeCenterArt() {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <span className="absolute -left-0.5 top-3 h-1.5 w-1.5 rounded-full bg-[#C4B5FD]" />
      <span className="absolute -right-0.5 bottom-3 h-1.5 w-1.5 rounded-full bg-[#C4B5FD]" />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F3E8FF] shadow-[0_0_20px_rgba(139,92,246,0.22)]">
        <VideoNodeSparkIcon className="text-[#8B5CF6]" size={24} />
      </div>
    </div>
  );
}
