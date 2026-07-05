export async function compressImageForUpload(
  file: File,
  options: {
    maxBytes: number;
    maxDimension?: number;
    quality?: number;
    fileNamePrefix?: string;
  }
) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  if (file.size <= options.maxBytes) {
    return file;
  }

  const image = await loadImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    image.close?.();
    throw new Error("Image compression is not available in this browser");
  }

  const initialMaxDimension = options.maxDimension ?? 1600;
  const initialQuality = options.quality ?? 0.82;
  let bestBlob: Blob | null = null;

  for (const dimension of [initialMaxDimension, 1400, 1200, 1000, 800, 640]) {
    const scale = Math.min(1, dimension / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image as CanvasImageSource, 0, 0, canvas.width, canvas.height);

    for (const quality of [initialQuality, 0.76, 0.68, 0.6, 0.52]) {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });
      if (!blob) continue;
      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
      }
      if (blob.size <= options.maxBytes) {
        image.close?.();
        const name = `${options.fileNamePrefix ?? "upload"}_${Date.now()}.jpg`;
        return new File([blob], name, { type: "image/jpeg" });
      }
    }
  }

  image.close?.();
  if (!bestBlob) {
    throw new Error("Image compression failed");
  }
  if (bestBlob.size > options.maxBytes) {
    throw new Error("Image is too large. Please choose a smaller image.");
  }
  const name = `${options.fileNamePrefix ?? "upload"}_${Date.now()}.jpg`;
  return new File([bestBlob], name, { type: "image/jpeg" });
}

async function loadImageBitmap(file: File): Promise<ImageBitmap & { close?: () => void }> {
  try {
    return await createImageBitmap(file);
  } catch {
    return loadImageBitmapViaElement(file);
  }
}

async function loadImageBitmapViaElement(file: File): Promise<ImageBitmap & { close?: () => void }> {
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
