import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { isObjectStorageConfigured, videoConfig } from "@/lib/core/config/video";
import { canPersistLocalDataStore } from "@/lib/runtime-flags";

const LOCAL_ROOT = path.join(process.cwd(), ".data", "object-storage");

let s3Client: S3Client | null = null;

function getS3Client() {
  if (!isObjectStorageConfigured()) return null;
  if (!s3Client) {
    const { endpoint, accessKey, secretKey, region } = videoConfig.r2;
    s3Client = new S3Client({
      region,
      endpoint: endpoint!,
      credentials: { accessKeyId: accessKey!, secretAccessKey: secretKey! },
      forcePathStyle: true
    });
  }
  return s3Client;
}

function localPathForKey(key: string) {
  const safe = key.replace(/\.\./g, "").replace(/^\/+/, "");
  return path.join(LOCAL_ROOT, safe);
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  const client = getS3Client();
  if (client) {
    await client.send(
      new PutObjectCommand({
        Bucket: videoConfig.r2.bucket,
        Key: key,
        Body: body,
        ContentType: contentType
      })
    );
    return { backend: "r2" as const, key };
  }

  if (!canPersistLocalDataStore()) {
    throw new Error("Durable object storage is required for production asset uploads");
  }
  const filePath = localPathForKey(key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body);
  return { backend: "local" as const, key };
}

export async function getObject(key: string): Promise<Buffer | null> {
  const client = getS3Client();
  if (client) {
    try {
      const res = await client.send(
        new GetObjectCommand({ Bucket: videoConfig.r2.bucket, Key: key })
      );
      const bytes = await res.Body?.transformToByteArray();
      return bytes ? Buffer.from(bytes) : null;
    } catch {
      return null;
    }
  }

  try {
    return await fs.readFile(localPathForKey(key));
  } catch {
    return null;
  }
}

export async function uploadDirectory(prefix: string, localDir: string) {
  const entries = await fs.readdir(localDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(localDir, entry.name);
    const data = await fs.readFile(filePath);
    const ext = entry.name.split(".").pop()?.toLowerCase();
    const mime =
      ext === "m3u8"
        ? "application/vnd.apple.mpegurl"
        : ext === "ts"
          ? "video/mp2t"
          : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : "application/octet-stream";
    await putObject(`${prefix}/${entry.name}`, data, mime);
  }
}

export function objectStorageBackendLabel() {
  if (isObjectStorageConfigured()) return "r2";
  return canPersistLocalDataStore() ? "local" : "unconfigured";
}
