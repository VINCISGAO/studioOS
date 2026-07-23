import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isObjectStorageConfigured, videoConfig } from "@/lib/core/config/video";
import { canPersistLocalDataStore } from "@/lib/runtime-flags";

const LOCAL_ROOT = path.join(process.cwd(), ".data", "object-storage");
const LOCAL_MULTIPART_ROOT = path.join(process.cwd(), ".data", "object-storage-multipart");
const PUT_OBJECT_TIMEOUT_MS = 30_000;

async function withPutObjectTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${Math.round(PUT_OBJECT_TIMEOUT_MS / 1000)}s`)),
      PUT_OBJECT_TIMEOUT_MS
    );
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

let s3Client: S3Client | null = null;

function objectStorageErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return String(error);
  const code =
    "name" in error && typeof error.name === "string" && error.name !== "Error"
      ? error.name
      : "R2Error";
  return `${code}: ${error.message}`;
}

function requireS3Client() {
  const client = getS3Client();
  if (!client) {
    throw new Error("Durable object storage is required for production asset uploads");
  }
  return client;
}

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
    try {
      await withPutObjectTimeout(
        client.send(
          new PutObjectCommand({
            Bucket: videoConfig.r2.bucket,
            Key: key,
            Body: body,
            ContentType: contentType
          })
        ),
        "R2 upload"
      );
    } catch (error) {
      throw new Error(`R2 upload failed (${objectStorageErrorMessage(error)})`);
    }
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

export async function createSignedObjectDownloadUrl(input: {
  key: string;
  fileName: string;
  expiresIn?: number;
}): Promise<string | null> {
  const client = getS3Client();
  if (!client) return null;

  const safeFileName = input.fileName.replace(/[\r\n"\\/]/g, "_").slice(0, 180) || "download";
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: videoConfig.r2.bucket,
      Key: input.key,
      ResponseContentDisposition: `attachment; filename="${safeFileName}"`
    }),
    { expiresIn: Math.min(Math.max(input.expiresIn ?? 60, 15), 300) }
  );
}

/** Presigned read URL for external providers (Seedance reference inputs). */
export async function createSignedObjectReadUrl(input: {
  key: string;
  expiresIn?: number;
}): Promise<string | null> {
  const client = getS3Client();
  if (!client) return null;

  const expiresIn = Math.min(Math.max(input.expiresIn ?? 3600, 60), 7 * 24 * 3600);
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: videoConfig.r2.bucket,
      Key: input.key
    }),
    { expiresIn }
  );
}

export async function getObjectMetadata(
  key: string
): Promise<{ contentLength: number | null; contentType: string | null } | null> {
  const client = getS3Client();
  if (client) {
    try {
      const res = await client.send(new HeadObjectCommand({ Bucket: videoConfig.r2.bucket, Key: key }));
      return {
        contentLength: res.ContentLength ?? null,
        contentType: res.ContentType ?? null
      };
    } catch {
      return null;
    }
  }

  try {
    const stat = await fs.stat(localPathForKey(key));
    return { contentLength: stat.size, contentType: null };
  } catch {
    return null;
  }
}

export async function getObjectRange(
  key: string,
  range?: { start: number; end: number }
): Promise<Buffer | null> {
  const client = getS3Client();
  if (client) {
    try {
      const res = await client.send(
        new GetObjectCommand({
          Bucket: videoConfig.r2.bucket,
          Key: key,
          Range: range ? `bytes=${range.start}-${range.end}` : undefined
        })
      );
      const bytes = await res.Body?.transformToByteArray();
      return bytes ? Buffer.from(bytes) : null;
    } catch {
      return null;
    }
  }

  try {
    const filePath = localPathForKey(key);
    if (!range) {
      return await fs.readFile(filePath);
    }
    const length = range.end - range.start + 1;
    const file = await fs.open(filePath, "r");
    try {
      const buffer = Buffer.alloc(length);
      await file.read(buffer, 0, length, range.start);
      return buffer;
    } finally {
      await file.close();
    }
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  const client = getS3Client();
  if (client) {
    await client.send(new DeleteObjectCommand({ Bucket: videoConfig.r2.bucket, Key: key }));
    return;
  }

  try {
    await fs.unlink(localPathForKey(key));
  } catch {
    // Object may already be gone.
  }
}

export async function createMultipartObjectUpload(key: string, contentType: string) {
  const client = getS3Client();
  if (!client) {
    if (!canPersistLocalDataStore()) {
      throw new Error("Durable object storage is required for production asset uploads");
    }
    const uploadId = `local_${Date.now()}_${randomBytes(8).toString("hex")}`;
    const uploadDir = path.join(LOCAL_MULTIPART_ROOT, uploadId);
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(
      path.join(uploadDir, "manifest.json"),
      JSON.stringify({ key, contentType, createdAt: new Date().toISOString() }, null, 2)
    );
    return { uploadId, key };
  }

  const res = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: videoConfig.r2.bucket,
      Key: key,
      ContentType: contentType
    })
  );
  if (!res.UploadId) {
    throw new Error("R2 multipart upload did not return an upload id");
  }
  return { uploadId: res.UploadId, key };
}

export async function uploadMultipartObjectPart(input: {
  key: string;
  uploadId: string;
  partNumber: number;
  body: Buffer;
}) {
  const client = getS3Client();
  if (!client) {
    if (!canPersistLocalDataStore()) {
      throw new Error("Durable object storage is required for production asset uploads");
    }
    if (!input.uploadId.startsWith("local_")) {
      throw new Error("Invalid local multipart upload id");
    }
    const uploadDir = path.join(LOCAL_MULTIPART_ROOT, input.uploadId);
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, `${input.partNumber}.part`), input.body);
    return { partNumber: input.partNumber, etag: `local-${input.partNumber}-${input.body.length}` };
  }

  const res = await client.send(
    new UploadPartCommand({
      Bucket: videoConfig.r2.bucket,
      Key: input.key,
      UploadId: input.uploadId,
      PartNumber: input.partNumber,
      Body: input.body
    })
  );
  if (!res.ETag) {
    throw new Error("R2 multipart part did not return an ETag");
  }
  return { partNumber: input.partNumber, etag: res.ETag };
}

export async function completeMultipartObjectUpload(input: {
  key: string;
  uploadId: string;
  parts: Array<{ partNumber: number; etag: string }>;
}) {
  const client = getS3Client();
  if (!client) {
    if (!canPersistLocalDataStore()) {
      throw new Error("Durable object storage is required for production asset uploads");
    }
    if (!input.uploadId.startsWith("local_")) {
      throw new Error("Invalid local multipart upload id");
    }
    const uploadDir = path.join(LOCAL_MULTIPART_ROOT, input.uploadId);
    const filePath = localPathForKey(input.key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const handle = await fs.open(filePath, "w");
    try {
      for (const part of [...input.parts].sort((a, b) => a.partNumber - b.partNumber)) {
        const chunk = await fs.readFile(path.join(uploadDir, `${part.partNumber}.part`));
        await handle.write(chunk);
      }
    } finally {
      await handle.close();
    }
    await fs.rm(uploadDir, { recursive: true, force: true });
    return;
  }

  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: videoConfig.r2.bucket,
      Key: input.key,
      UploadId: input.uploadId,
      MultipartUpload: {
        Parts: input.parts
          .sort((a, b) => a.partNumber - b.partNumber)
          .map((part) => ({ PartNumber: part.partNumber, ETag: part.etag }))
      }
    })
  );
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
