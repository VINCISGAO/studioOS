const AVATAR_TONES = [
  "bg-zinc-900 text-white",
  "bg-sky-600 text-white",
  "bg-violet-600 text-white",
  "bg-emerald-600 text-white",
  "bg-amber-600 text-white"
] as const;

const INITIAL_OVERRIDES: Record<string, string> = {
  creator_01: "NM",
  creator_02: "SF",
  creator_03: "A"
};

const AVATAR_OVERRIDES: Record<string, string> = {
  creator_01: "bg-zinc-900 text-white",
  creator_02: "bg-violet-600 text-white",
  creator_03: "bg-sky-600 text-white"
};

export function creatorInitials(name: string, creatorId?: string) {
  if (creatorId && INITIAL_OVERRIDES[creatorId]) {
    return INITIAL_OVERRIDES[creatorId];
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function creatorAvatarTone(creatorId: string) {
  if (AVATAR_OVERRIDES[creatorId]) {
    return AVATAR_OVERRIDES[creatorId];
  }

  let hash = 0;
  for (let index = 0; index < creatorId.length; index += 1) {
    hash = (hash + creatorId.charCodeAt(index)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash] ?? AVATAR_TONES[0];
}
