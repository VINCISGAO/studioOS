import {
  murekaCreateEasySongTask,
  murekaCreateInstrumentalTask,
  murekaCreateSongTask,
  murekaGenerateLyrics,
  resolveMurekaModelId,
  type MurekaAsyncTask,
  type MurekaModelId
} from "@/lib/canvas/mureka-client";

export type MusicJobPayload = {
  mode?: string;
  style?: string;
  mood?: string;
  instrumental?: boolean;
  lyrics?: string;
  songName?: string;
  vocalGender?: string;
};

function readPayload(raw: unknown): MusicJobPayload {
  if (!raw || typeof raw !== "object") return {};
  const record = raw as Record<string, unknown>;
  return {
    mode: typeof record.mode === "string" ? record.mode : undefined,
    style: typeof record.style === "string" ? record.style : undefined,
    mood: typeof record.mood === "string" ? record.mood : undefined,
    instrumental: typeof record.instrumental === "boolean" ? record.instrumental : undefined,
    lyrics: typeof record.lyrics === "string" ? record.lyrics : undefined,
    songName: typeof record.songName === "string" ? record.songName : undefined,
    vocalGender: typeof record.vocalGender === "string" ? record.vocalGender : undefined
  };
}

function buildStylePrompt(payload: MusicJobPayload, fallbackPrompt: string) {
  const parts = [
    payload.style?.trim(),
    payload.mood?.trim() && payload.mood?.trim() !== payload.style?.trim() ? payload.mood?.trim() : "",
    fallbackPrompt.trim()
  ].filter(Boolean);
  return parts.join(", ").slice(0, 1024);
}

function readGender(payload: MusicJobPayload): "female" | "male" | undefined {
  if (payload.vocalGender === "male") return "male";
  if (payload.vocalGender === "female") return "female";
  return undefined;
}

function readEasyStyles(payload: MusicJobPayload) {
  const source = payload.style?.trim();
  if (!source) return undefined;
  const tokens = source
    .split(/[,，/|·]+/u)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 4);
  return tokens.length ? tokens : undefined;
}

async function ensureLyrics(payload: MusicJobPayload, prompt: string) {
  const existing = payload.lyrics?.trim();
  if (existing) return existing;

  const seed = payload.songName?.trim() || prompt.trim() || payload.style?.trim() || "Original song";
  const generated = await murekaGenerateLyrics(seed);
  const lyrics = generated.lyrics?.trim();
  if (!lyrics) {
    throw new Error("Mureka lyrics generation returned empty lyrics");
  }
  return lyrics;
}

export async function submitMurekaMusicTask(input: {
  internalModelId: string;
  prompt: string;
  payload: unknown;
}): Promise<{ kind: "song" | "instrumental"; task: MurekaAsyncTask; model: MurekaModelId }> {
  const payload = readPayload(input.payload);
  const model = resolveMurekaModelId(input.internalModelId);
  const mode = (payload.mode ?? "custom").toLowerCase();
  const instrumental = payload.instrumental === true || mode === "soundtrack";
  const stylePrompt = buildStylePrompt(payload, input.prompt);

  if (instrumental || mode === "soundtrack") {
    const soundtrackPrompt =
      mode === "soundtrack"
        ? `cinematic soundtrack, ${stylePrompt}`.slice(0, 1024)
        : stylePrompt;
    const task = await murekaCreateInstrumentalTask({
      model,
      prompt: soundtrackPrompt || "instrumental background music",
      n: 1
    });
    return { kind: "instrumental", task, model };
  }

  if (mode === "simple") {
    const task = await murekaCreateEasySongTask({
      model,
      prompt: stylePrompt || input.prompt || "catchy pop song",
      styles: readEasyStyles(payload),
      n: 1
    });
    return { kind: "song", task, model };
  }

  const lyrics = await ensureLyrics(payload, input.prompt);
  const task = await murekaCreateSongTask({
    model,
    lyrics,
    prompt: stylePrompt || undefined,
    gender: readGender(payload),
    n: 1
  });
  return { kind: "song", task, model };
}

export { readPayload as readMusicJobPayload };
