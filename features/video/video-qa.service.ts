import { appError } from "@/lib/core/errors";
import { videoConfig } from "@/lib/core/config/video";
import { isFfprobeAvailable, probeVideo } from "@/lib/studioos/video-probe";

export type VideoQaResult = {
  passed: boolean;
  source: "ffprobe" | "skipped";
  durationSec: number | null;
  width: number | null;
  height: number | null;
  codec: string | null;
  warnings: string[];
};

export class VideoQaService {
  async validateSource(sourcePath: string): Promise<VideoQaResult> {
    if (!isFfprobeAvailable()) {
      return {
        passed: true,
        source: "skipped",
        durationSec: null,
        width: null,
        height: null,
        codec: null,
        warnings: ["ffprobe disabled or unavailable — QA gate skipped"]
      };
    }

    const probe = await probeVideo(sourcePath);
    if (!probe) {
      return {
        passed: true,
        source: "skipped",
        durationSec: null,
        width: null,
        height: null,
        codec: null,
        warnings: ["ffprobe could not read file — allowing upload in dev"]
      };
    }

    const warnings: string[] = [];
    if (probe.durationSec <= 0) {
      throw appError("VALIDATION_ERROR", "Video has zero duration");
    }
    if (probe.durationSec > 600) {
      warnings.push("Video longer than 10 minutes");
    }
    const minDim = Math.min(probe.width, probe.height);
    if (minDim < 480) {
      warnings.push(`Low resolution (${probe.width}×${probe.height})`);
    }

    return {
      passed: true,
      source: "ffprobe",
      durationSec: probe.durationSec,
      width: probe.width,
      height: probe.height,
      codec: probe.codec,
      warnings
    };
  }

  assertUploadSize(bytes: number) {
    if (bytes > videoConfig.maxUploadBytes) {
      throw appError("VALIDATION_ERROR", "File exceeds 500MB limit");
    }
    if (bytes <= 0) {
      throw appError("VALIDATION_ERROR", "Empty file");
    }
  }
}

export const videoQaService = new VideoQaService();
