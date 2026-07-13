function isRasterImageFile(file: File) {
  if (file.type === "image/svg+xml") return false;
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    return loadImageBitmapViaElement(file);
  }
}

async function loadImageBitmapViaElement(file: File): Promise<ImageBitmap> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Image load failed"));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image load failed");
    ctx.drawImage(img, 0, 0);
    return createImageBitmap(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function encodeJpeg(canvas: HTMLCanvasElement, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob) {
    throw new Error("Image compression failed");
  }
  return blob;
}

/** Fast single-pass JPEG resize for non-crop uploads. Avoids multi-loop re-encode. */
export async function compressImageForUpload(
  file: File,
  options: {
    maxBytes: number;
    maxDimension?: number;
    quality?: number;
    fileNamePrefix?: string;
  }
) {
  if (!isRasterImageFile(file)) {
    return file;
  }

  if (file.size <= options.maxBytes) {
    return file;
  }

  const image = await loadImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    image.close();
    throw new Error("Image compression is not available in this browser");
  }

  const maxDimension = options.maxDimension ?? 1600;
  const baseQuality = options.quality ?? 0.82;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();

  const qualities = [baseQuality, Math.max(0.62, baseQuality - 0.1), Math.max(0.55, baseQuality - 0.18)];
  let bestBlob: Blob | null = null;

  for (const quality of qualities) {
    const blob = await encodeJpeg(canvas, quality);
    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }
    if (blob.size <= options.maxBytes) {
      const name = `${options.fileNamePrefix ?? "upload"}_${Date.now()}.jpg`;
      return new File([blob], name, { type: "image/jpeg" });
    }
  }

  if (!bestBlob || bestBlob.size > options.maxBytes) {
    throw new Error("Image is too large. Please choose a smaller image.");
  }

  const name = `${options.fileNamePrefix ?? "upload"}_${Date.now()}.jpg`;
  return new File([bestBlob], name, { type: "image/jpeg" });
}
