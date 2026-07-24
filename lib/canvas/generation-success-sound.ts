import type { GenerationJobEvent } from "@/lib/canvas/types";

let sharedContext: AudioContext | null = null;

function canPlaySuccessSound() {
  if (typeof window === "undefined") return false;
  if (document.visibilityState === "hidden") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getAudioContext() {
  if (!canPlaySuccessSound()) return null;
  if (!sharedContext) {
    sharedContext = new AudioContext();
  }
  return sharedContext;
}

function playChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.1, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(784, now);
  osc.frequency.exponentialRampToValueAtTime(988, now + 0.06);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.28);
}

/** Call from a user gesture (e.g. generate click) so playback works after async completion. */
export function primeGenerationSuccessSound() {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "suspended") return;
  void ctx.resume();
}

export function playGenerationSuccessSound(_type: GenerationJobEvent["type"]) {
  const ctx = getAudioContext();
  if (!ctx) return;

  void ctx.resume().then(() => {
    if (ctx.state !== "running") return;
    playChime(ctx);
  });
}
