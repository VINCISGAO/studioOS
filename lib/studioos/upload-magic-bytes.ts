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

const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function normalizeDeclaredImageMime(mime: string) {
  const trimmed = mime.trim().toLowerCase();
  if (trimmed === "image/jpg" || trimmed === "image/pjpeg") return "image/jpeg";
  return trimmed;
}

function imageMimeFromFileName(fileName: string) {
  const name = fileName.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".heic") || name.endsWith(".heif")) return null;
  return null;
}

/** Trust magic bytes first; fall back to declared type / extension when browsers mislabel files. */
export function resolveTrustedImageMime(file: File, buffer: Buffer): string | null {
  const detected = detectImageMimeFromMagicBytes(buffer);
  if (detected && ALLOWED_IMAGE_MIME.has(detected)) return detected;

  const declared = normalizeDeclaredImageMime(file.type || "");
  if (declared && ALLOWED_IMAGE_MIME.has(declared)) return declared;

  return imageMimeFromFileName(file.name);
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
