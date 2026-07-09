import { createRequire } from "node:module";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";

const require = createRequire(import.meta.url);
require("./helpers/load-env.cjs");

const DEFAULT_MARKETING_CDN = "https://pub-f68761fae15346faa85da45b7929e5bb.r2.dev";

const HERO_OBJECTS = [
  ["en", "VINCIS Brand Film (EN).mp4"],
  ["zh-CN", "VINCIS Brand Film (ZH-CN).mp4"],
  ["zh-TW", "VINCIS Brand Film (ZH-TW).mp4"],
  ["ja", "VINCIS Brand Film (JA).mp4"],
  ["ko", "VINCIS Brand Film (KO).mp4"],
  ["ms", "VINCIS Brand Film (MS).mp4"],
  ["km", "VINCIS Brand Film (KM).mp4"],
  ["th", "VINCIS Brand Film (TH).mp4"],
  ["vi", "VINCIS Brand Film (VI).mp4"],
  ["fr", "VINCIS Brand Film (FR).mp4"],
  ["es", "VINCIS Brand Film (ES).mp4"]
];

function normalizeEndpoint(raw, bucket) {
  const value = raw?.trim();
  if (!value) return null;
  const trimmed = value.replace(/\/+$/u, "");
  const suffix = `/${bucket}`;
  return trimmed.endsWith(suffix) ? trimmed.slice(0, -suffix.length) : trimmed;
}

function encodeObjectKey(objectKey) {
  return objectKey
    .split("/")
    .map((segment) => (segment ? encodeURIComponent(segment) : ""))
    .join("/");
}

async function main() {
  const bucket = process.env.R2_BUCKET?.trim() || "studioos";
  const endpoint = normalizeEndpoint(process.env.R2_ENDPOINT, bucket);
  const accessKey = process.env.R2_ACCESS_KEY?.trim();
  const secretKey = process.env.R2_SECRET_KEY?.trim();
  const region = process.env.R2_REGION?.trim() || "auto";
  const cdnBase = (
    process.env.MARKETING_CDN_UPSTREAM?.trim() ||
    process.env.NEXT_PUBLIC_MARKETING_CDN_URL?.trim() ||
    DEFAULT_MARKETING_CDN
  ).replace(/\/+$/u, "");

  console.log(`[verify-hero-r2] bucket=${bucket}`);
  console.log(`[verify-hero-r2] cdn=${cdnBase}`);

  let s3 = null;
  if (endpoint && accessKey && secretKey) {
    s3 = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      forcePathStyle: true
    });
  } else {
    console.log("[verify-hero-r2] R2 API credentials missing — checking public CDN only");
  }

  let missing = 0;

  for (const [locale, fileName] of HERO_OBJECTS) {
    const key = `videos/home/hero/${fileName}`;
    const sitePath = `/videos/home/hero/${encodeURIComponent(fileName)}`;
    const flatKey = fileName;

    let apiStatus = "skip";
    if (s3) {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        apiStatus = "ok";
      } catch {
        try {
          await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: flatKey }));
          apiStatus = "ok-flat";
        } catch {
          apiStatus = "missing";
          missing += 1;
        }
      }
    }

    const cdnUrl = `${cdnBase}/${encodeObjectKey(key)}`;
    const cdnResponse = await fetch(cdnUrl, {
      method: "HEAD",
      headers: { Range: "bytes=0-0" }
    }).catch(() => null);
    let cdnStatus = cdnResponse && (cdnResponse.ok || cdnResponse.status === 206) ? "ok" : "missing";
    if (cdnStatus === "missing") {
      const flatCdnUrl = `${cdnBase}/${encodeObjectKey(flatKey)}`;
      const flatResponse = await fetch(flatCdnUrl, {
        method: "HEAD",
        headers: { Range: "bytes=0-0" }
      }).catch(() => null);
      if (flatResponse && (flatResponse.ok || flatResponse.status === 206)) {
        cdnStatus = "ok-flat";
      } else {
        missing += 1;
      }
    }

    console.log(`[verify-hero-r2] ${locale} api=${apiStatus} cdn=${cdnStatus} key=${key} site=${sitePath}`);
  }

  if (missing > 0) {
    console.log("[verify-hero-r2] missing objects detected — run: npm run marketing:upload-hero-videos");
    process.exit(1);
  }

  console.log("[verify-hero-r2] all hero objects present");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
