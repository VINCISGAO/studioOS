import { createReadStream } from "node:fs";
import { basename } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { cloudConfig } from "./config.mjs";
import { logBackup } from "./logger.mjs";

function buildClient(cfg) {
  const options = {
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey
    }
  };
  if (cfg.endpoint) {
    options.endpoint = cfg.endpoint;
    options.forcePathStyle = true;
  }
  return new S3Client(options);
}

export function isCloudConfigured() {
  const cfg = cloudConfig();
  return Boolean(cfg.enabled && cfg.bucket && cfg.accessKeyId && cfg.secretAccessKey);
}

/**
 * Upload a local backup file to S3-compatible storage (AWS S3, Cloudflare R2, MinIO).
 * Credentials via BACKUP_S3_* or R2_* environment variables.
 */
export async function uploadToCloud(localPath, kind) {
  const cfg = cloudConfig();
  if (!cfg.enabled) {
    return { uploaded: false, reason: "cloud_disabled" };
  }
  if (!cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey) {
    return { uploaded: false, reason: "missing_credentials" };
  }

  const prefix = kind === "database" ? cfg.databasePrefix : cfg.projectPrefix;
  const key = `${prefix}${basename(localPath)}`;
  const client = buildClient(cfg);
  const body = createReadStream(localPath);

  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body
    })
  );

  logBackup(`CLOUD UPLOAD OK: s3://${cfg.bucket}/${key}`);
  return { uploaded: true, bucket: cfg.bucket, key };
}

/** Lightweight connectivity check — lists nothing, validates client config only. */
export async function verifyCloudConfig() {
  const cfg = cloudConfig();
  if (!cfg.enabled) {
    return { ok: true, mode: "disabled" };
  }
  if (!cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey) {
    return { ok: false, mode: "misconfigured", detail: "Set BACKUP_S3_BUCKET, BACKUP_S3_ACCESS_KEY, BACKUP_S3_SECRET_KEY" };
  }
  buildClient(cfg);
  return { ok: true, mode: "configured", bucket: cfg.bucket, endpoint: cfg.endpoint ?? "aws-default" };
}
