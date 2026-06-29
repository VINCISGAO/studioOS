export type CommercialRefineOptions = {
  prompt: string;
  locale: "en" | "zh";
};

function wantsWhiteBackground(prompt: string) {
  const value = prompt.toLowerCase();
  return (
    value.includes("白") ||
    value.includes("white") ||
    value.includes("seamless") ||
    value.includes("studio")
  );
}

export async function renderCommercialProductImage(
  source: HTMLImageElement,
  options: CommercialRefineOptions
): Promise<Blob> {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas unavailable");
  }

  if (wantsWhiteBackground(options.prompt)) {
    ctx.fillStyle = "#f7f7f5";
    ctx.fillRect(0, 0, size, size);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, "#f5f5f4");
    gradient.addColorStop(1, "#e7e5e4");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  const scale = Math.min(size / source.width, size / source.height) * 0.82;
  const width = source.width * scale;
  const height = source.height * scale;
  const x = (size - width) / 2;
  const y = (size - height) / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  ctx.filter = "brightness(1.06) contrast(1.14) saturate(1.12)";
  ctx.drawImage(source, x, y, width, height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Export failed"));
        }
      },
      "image/jpeg",
      0.92
    );
  });
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}
