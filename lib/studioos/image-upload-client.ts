export async function compressImageForUpload(
  file: File,
  options: {
    maxBytes: number;
    maxDimension?: number;
    quality?: number;
    fileNamePrefix?: string;
  }
) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  if (file.size <= options.maxBytes) {
    return file;
  }

  const maxDimension = options.maxDimension ?? 1600;
  const quality = options.quality ?? 0.82;
  const image = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(image, 0, 0, width, height);
  image.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob || blob.size >= file.size) {
    return file;
  }

  const name = `${options.fileNamePrefix ?? "upload"}_${Date.now()}.jpg`;
  return new File([blob], name, { type: "image/jpeg" });
}
