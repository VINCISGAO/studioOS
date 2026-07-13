import {
  PROFILE_AVATAR_OUTPUT,
  PROFILE_COVER_OUTPUT,
  type ProfileImageOutputPreset
} from "@/lib/studioos/profile-image-output";

export const PROFILE_AVATAR_ASPECT = 1;
export const PROFILE_COVER_ASPECT = 21 / 9;

export type ImageCropTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type ImageCropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function computeCoverScale(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number
) {
  return Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);
}

export function centerCoverTransform(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number
): ImageCropTransform {
  const scale = computeCoverScale(imageWidth, imageHeight, viewportWidth, viewportHeight);
  const displayWidth = imageWidth * scale;
  const displayHeight = imageHeight * scale;
  return {
    scale,
    offsetX: (viewportWidth - displayWidth) / 2,
    offsetY: (viewportHeight - displayHeight) / 2
  };
}

export function clampCoverTransform(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  transform: ImageCropTransform
): ImageCropTransform {
  const minScale = computeCoverScale(imageWidth, imageHeight, viewportWidth, viewportHeight);
  const scale = Math.max(minScale, Math.min(minScale * 3, transform.scale));
  const displayWidth = imageWidth * scale;
  const displayHeight = imageHeight * scale;
  const minOffsetX = viewportWidth - displayWidth;
  const minOffsetY = viewportHeight - displayHeight;
  return {
    scale,
    offsetX: Math.min(0, Math.max(minOffsetX, transform.offsetX)),
    offsetY: Math.min(0, Math.max(minOffsetY, transform.offsetY))
  };
}

export function cropAreaFromTransform(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  transform: ImageCropTransform
): ImageCropArea {
  const x = Math.max(0, -transform.offsetX / transform.scale);
  const y = Math.max(0, -transform.offsetY / transform.scale);
  const width = Math.min(imageWidth - x, viewportWidth / transform.scale);
  const height = Math.min(imageHeight - y, viewportHeight / transform.scale);
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height))
  };
}

export async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Image load failed"));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type ImageCropPreview = {
  url: string;
  width: number;
  height: number;
  revoke?: () => void;
};

/** Decode a raster file into a preview URL for the crop UI (no full re-encode). */
export async function prepareImageCropPreview(file: File): Promise<ImageCropPreview> {
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    throw new Error("SVG is not supported for cropping");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const bitmap = await createImageBitmap(file);
    const width = bitmap.width;
    const height = bitmap.height;
    bitmap.close();
    if (!width || !height) {
      throw new Error("Image has no dimensions");
    }
    return {
      url: objectUrl,
      width,
      height,
      revoke: () => URL.revokeObjectURL(objectUrl)
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function encodeCanvasJpeg(canvas: HTMLCanvasElement, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob) {
    throw new Error("Image crop failed");
  }
  return blob;
}

export async function renderCroppedImageFile(
  file: File,
  crop: ImageCropArea,
  options?: {
    maxDimension?: number;
    quality?: number;
    maxBytes?: number;
    outputPreset?: ProfileImageOutputPreset;
    fileNamePrefix?: string;
  }
) {
  const preset = options?.outputPreset
    ? options.outputPreset === "cover"
      ? PROFILE_COVER_OUTPUT
      : PROFILE_AVATAR_OUTPUT
    : null;
  const maxDimension = options?.maxDimension ?? preset?.maxDimension ?? 1600;
  const quality = options?.quality ?? preset?.quality ?? 0.82;
  const maxBytes = options?.maxBytes ?? preset?.maxBytes;

  const bitmap = await createImageBitmap(file);
  try {
    const longest = Math.max(crop.width, crop.height);
    const outputScale = longest > maxDimension ? maxDimension / longest : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(crop.width * outputScale));
    canvas.height = Math.max(1, Math.round(crop.height * outputScale));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Image crop is not available in this browser");
    }
    ctx.drawImage(
      bitmap,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const qualities = maxBytes
      ? [quality, Math.max(0.64, quality - 0.1), Math.max(0.58, quality - 0.16)]
      : [quality];
    let blob: Blob | null = null;

    for (const nextQuality of qualities) {
      const candidate = await encodeCanvasJpeg(canvas, nextQuality);
      blob = candidate;
      if (!maxBytes || candidate.size <= maxBytes) {
        break;
      }
    }

    if (!blob) {
      throw new Error("Image crop failed");
    }
    if (maxBytes && blob.size > maxBytes) {
      throw new Error("Image is too large after crop. Try zooming out slightly.");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || options?.fileNamePrefix || "cropped";
    const name = `${options?.fileNamePrefix ?? baseName}_${Date.now()}.jpg`;
    return new File([blob], name, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
