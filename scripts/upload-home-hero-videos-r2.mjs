import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand
} from "@aws-sdk/client-s3";

const require = createRequire(import.meta.url);
require("./helpers/load-env.cjs");

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const heroDir = path.join(root, "public", "videos", "home", "hero");
const PART_SIZE = 10 * 1024 * 1024;
const MULTIPART_THRESHOLD = 8 * 1024 * 1024;

function normalizeEndpoint(raw, bucket) {
  const value = raw?.trim();
  if (!value) return null;
  const trimmed = value.replace(/\/+$/u, "");
  const suffix = `/${bucket}`;
  return trimmed.endsWith(suffix) ? trimmed.slice(0, -suffix.length) : trimmed;
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} — set R2 credentials in .env.local`);
  }
  return value;
}

async function uploadFile(client, bucket, key, filePath) {
  const stat = await fs.stat(filePath);
  const fileName = path.basename(filePath);

  if (stat.size <= MULTIPART_THRESHOLD) {
    const body = await fs.readFile(filePath);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "video/mp4",
        CacheControl: "public, max-age=31536000, immutable"
      })
    );
    console.log(`[upload-hero-videos] put ${fileName} (${stat.size} bytes)`);
    return;
  }

  const created = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: "video/mp4",
      CacheControl: "public, max-age=31536000, immutable"
    })
  );
  if (!created.UploadId) {
    throw new Error(`Multipart upload failed to start for ${fileName}`);
  }

  const parts = [];
  const handle = await fs.open(filePath, "r");
  try {
    let partNumber = 1;
    for (let offset = 0; offset < stat.size; offset += PART_SIZE) {
      const length = Math.min(PART_SIZE, stat.size - offset);
      const chunk = Buffer.alloc(length);
      await handle.read(chunk, 0, length, offset);
      const uploaded = await client.send(
        new UploadPartCommand({
          Bucket: bucket,
          Key: key,
          UploadId: created.UploadId,
          PartNumber: partNumber,
          Body: chunk
        })
      );
      if (!uploaded.ETag) {
        throw new Error(`Missing ETag for ${fileName} part ${partNumber}`);
      }
      parts.push({ PartNumber: partNumber, ETag: uploaded.ETag });
      console.log(`[upload-hero-videos] ${fileName} part ${partNumber} (${length} bytes)`);
      partNumber += 1;
    }
  } finally {
    await handle.close();
  }

  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: created.UploadId,
      MultipartUpload: { Parts: parts }
    })
  );
  console.log(`[upload-hero-videos] completed multipart ${fileName} (${stat.size} bytes)`);
}

async function main() {
  const bucket = process.env.R2_BUCKET?.trim() || "studioos";
  const endpoint = normalizeEndpoint(process.env.R2_ENDPOINT, bucket);
  const accessKey = requireEnv("R2_ACCESS_KEY");
  const secretKey = requireEnv("R2_SECRET_KEY");
  const region = process.env.R2_REGION?.trim() || "auto";
  const cdn = process.env.NEXT_PUBLIC_MARKETING_CDN_URL?.trim().replace(/\/+$/u, "");

  if (!endpoint) {
    throw new Error("Missing R2_ENDPOINT");
  }

  const client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true
  });

  const entries = await fs.readdir(heroDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".mp4")).map((entry) => entry.name);
  if (!files.length) {
    throw new Error(`No .mp4 files found in ${heroDir}`);
  }

  console.log(`[upload-hero-videos] uploading ${files.length} files to bucket ${bucket}`);
  for (const fileName of files.sort()) {
    const key = `videos/home/hero/${fileName}`;
    await uploadFile(client, bucket, key, path.join(heroDir, fileName));
    if (cdn) {
      console.log(`[upload-hero-videos] url ${cdn}${encodeURI(`/videos/home/hero/${fileName}`)}`);
    }
  }

  console.log("[upload-hero-videos] done");
  if (!cdn) {
    console.log("[upload-hero-videos] set NEXT_PUBLIC_MARKETING_CDN_URL to your public R2/custom domain");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
