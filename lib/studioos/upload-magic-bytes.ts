const JPEG_HEADER = [0xff, 0xd8, 0xff];
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const GIF87A = "GIF87a";
const GIF89A = "GIF89a";
const RIFF = "RIFF";
const WEBP = "WEBP";
const FTYP = "ftyp";
const WEBM_HEADER = [0x1a, 0x45, 0xdf, 0xa3];

function hasPrefix(buffer: Buffer, bytes: number[]) {
  return bytes.every((byte, index) => buffer[index] === byte);
}

function ascii(buffer: Buffer, start: number, end: number) {
  return buffer.subarray(start, end).toString("ascii");
}

export function detectImageMimeFromMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (hasPrefix(buffer, JPEG_HEADER)) return "image/jpeg";
  if (hasPrefix(buffer, PNG_HEADER)) return "image/png";

  const gif = ascii(buffer, 0, 6);
  if (gif === GIF87A || gif === GIF89A) return "image/gif";

  if (ascii(buffer, 0, 4) === RIFF && ascii(buffer, 8, 12) === WEBP) {
    return "image/webp";
  }

  return null;
}

export function looksLikeMp4OrMov(buffer: Buffer) {
  if (buffer.length < 12) return false;
  return ascii(buffer, 4, 8) === FTYP;
}

export function looksLikeSupportedVideo(buffer: Buffer, extension: "mp4" | "mov" | "webm") {
  if (extension === "webm") {
    return hasPrefix(buffer, WEBM_HEADER);
  }
  return looksLikeMp4OrMov(buffer);
}
