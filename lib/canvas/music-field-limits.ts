/** Shared music generation field limits — UI + API validation must stay in sync. */
export const MUSIC_TITLE_MAX = 120;
export const MUSIC_STYLE_MAX = 2000;
export const MUSIC_LYRICS_MAX = 10000;
export const MUSIC_PROMPT_MAX = 12200;

export const MUSIC_TITLE_WARN_AT = 100;
export const MUSIC_STYLE_WARN_AT = 1600;
export const MUSIC_LYRICS_WARN_AT = 8000;

export function musicFieldLimitMessage(max: number, locale: "zh" | "en" = "zh") {
  return locale === "zh" ? `最多可输入 ${max} 个字符` : `Maximum ${max} characters allowed`;
}

export function musicFieldLimitsExceeded(input: {
  songName: string;
  style: string;
  lyrics: string;
  instrumental: boolean;
}) {
  if (input.songName.length > MUSIC_TITLE_MAX) return true;
  if (input.style.length > MUSIC_STYLE_MAX) return true;
  if (!input.instrumental && input.lyrics.length > MUSIC_LYRICS_MAX) return true;
  return false;
}
