import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export type VideoProbe = {
  width: number;
  height: number;
  durationSec: number;
  codec: string;
  aspectRatio: number;
  aspectLabel: string;
  source: string;
};

type FfprobeStream = {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
};

type FfprobePayload = {
  format?: { duration?: string };
  streams?: FfprobeStream[];
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function formatAspect(width: number, height: number): string {
  const d = gcd(width, height);
  return `${width / d}:${height / d}`;
}

function isVertical916(ratio: number): boolean {
  const target = 9 / 16;
  return Math.abs(ratio - target) < 0.04;
}

/** Probe video via ffprobe. Works with local paths and http(s) URLs. */
export async function probeVideo(source: string): Promise<VideoProbe | null> {
  if (!source?.trim()) return null;

  try {
    const { stdout } = await execFileAsync(
      "ffprobe",
      ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", source],
      { timeout: 30_000, maxBuffer: 2 * 1024 * 1024 }
    );

    const payload = JSON.parse(stdout) as FfprobePayload;
    const videoStream = payload.streams?.find((s) => s.codec_type === "video");
    if (!videoStream?.width || !videoStream?.height) return null;

    const durationSec = Number(payload.format?.duration ?? 0);
    const aspectRatio = videoStream.width / videoStream.height;

    return {
      width: videoStream.width,
      height: videoStream.height,
      durationSec: Number.isFinite(durationSec) ? durationSec : 0,
      codec: videoStream.codec_name ?? "unknown",
      aspectRatio,
      aspectLabel: formatAspect(videoStream.width, videoStream.height),
      source
    };
  } catch {
    return null;
  }
}

export function isFfprobeAvailable(): boolean {
  return process.env.STUDIOOS_DISABLE_FFPROBE !== "1";
}

export { isVertical916 };
