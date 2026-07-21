export const DEFAULT_CANVAS_BACKGROUND = "#f7f7f6";

export const CANVAS_BACKGROUND_PRESETS = [
  "#f7f7f6",
  "#111111",
  "#ffffff",
  "#84cc16",
  "#9333ea",
  "#c4b5fd"
] as const;

export function normalizeHexColor(value: string) {
  const trimmed = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(trimmed)) return null;
  return `#${trimmed.toLowerCase()}`;
}

export function hexToHsv(hex: string) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return { h: 0, s: 0, v: 97 };

  const raw = normalized.slice(1);
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;
  return { h, s, v };
}

export function hsvToHex(h: number, s: number, v: number) {
  const saturation = s / 100;
  const value = v / 100;
  const chroma = value * saturation;
  const huePrime = (h / 60) % 6;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;

  if (huePrime >= 0 && huePrime < 1) [r, g, b] = [chroma, x, 0];
  else if (huePrime >= 1 && huePrime < 2) [r, g, b] = [x, chroma, 0];
  else if (huePrime >= 2 && huePrime < 3) [r, g, b] = [0, chroma, x];
  else if (huePrime >= 3 && huePrime < 4) [r, g, b] = [0, x, chroma];
  else if (huePrime >= 4 && huePrime < 5) [r, g, b] = [x, 0, chroma];
  else [r, g, b] = [chroma, 0, x];

  const m = value - chroma;
  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function isDarkCanvasBackground(hex: string) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return false;
  const raw = normalized.slice(1);
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
