import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";
import { videoConfig } from "@/lib/core/config/video";
import { probeVideo } from "@/lib/studioos/video-probe";

const execFileAsync = promisify(execFile);

export async function isFfmpegAvailable(): Promise<boolean> {
  try {
    await execFileAsync("ffmpeg", ["-version"], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

export async function transcodeToHls(input: {
  sourcePath: string;
  outputDir: string;
  watermark?: boolean;
  height?: number;
}): Promise<{ manifestPath: string; durationSec: number }> {
  await fs.mkdir(input.outputDir, { recursive: true });
  const manifestPath = path.join(input.outputDir, "index.m3u8");
  const segmentPattern = path.join(input.outputDir, "seg%03d.ts");

  const height = input.height ?? videoConfig.targetHeight;
  const vf = input.watermark
    ? `scale=-2:${height},drawtext=text='${videoConfig.watermarkText}':fontsize=24:fontcolor=white@0.45:x=24:y=24`
    : `scale=-2:${height}`;

  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-i",
      input.sourcePath,
      "-vf",
      vf,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-hls_time",
      String(videoConfig.hlsSegmentSeconds),
      "-hls_playlist_type",
      "vod",
      "-hls_segment_filename",
      segmentPattern,
      "-f",
      "hls",
      manifestPath
    ],
    { timeout: 600_000, maxBuffer: 8 * 1024 * 1024 }
  );

  const probe = await probeVideo(input.sourcePath);
  return { manifestPath, durationSec: probe?.durationSec ?? 0 };
}

export async function extractThumbnail(input: {
  sourcePath: string;
  outputPath: string;
  atSec?: number;
}) {
  await fs.mkdir(path.dirname(input.outputPath), { recursive: true });
  const at = input.atSec ?? 1;
  await execFileAsync(
    "ffmpeg",
    ["-y", "-ss", String(at), "-i", input.sourcePath, "-frames:v", "1", "-q:v", "2", input.outputPath],
    { timeout: 60_000 }
  );
}
