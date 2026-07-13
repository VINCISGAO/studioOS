/** Target encode settings for profile avatar / cover uploads (single-pass crop output). */
export const PROFILE_AVATAR_OUTPUT = {
  maxDimension: 800,
  quality: 0.8,
  maxBytes: 520_000
} as const;

export const PROFILE_COVER_OUTPUT = {
  maxDimension: 1920,
  quality: 0.78,
  maxBytes: 1_200_000
} as const;

export type ProfileImageOutputPreset = "avatar" | "cover";

export function profileImageOutputForPreset(preset: ProfileImageOutputPreset) {
  return preset === "cover" ? PROFILE_COVER_OUTPUT : PROFILE_AVATAR_OUTPUT;
}
