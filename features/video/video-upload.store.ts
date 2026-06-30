import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const CHUNK_DIR = path.join(process.cwd(), ".data", "uploads", "chunks");
export const DEFAULT_CHUNK_BYTES = 5 * 1024 * 1024;

export type ChunkUploadSession = {
  id: string;
  campaignId: string;
  fileName: string;
  mimeType: string;
  totalSize: number;
  totalChunks: number;
  receivedChunks: number[];
  uploadedBy: string;
  status: "UPLOADING" | "MERGING" | "COMPLETE" | "FAILED";
  createdAt: string;
};

function sessionDir(uploadId: string) {
  return path.join(CHUNK_DIR, uploadId);
}

function metaPath(uploadId: string) {
  return path.join(sessionDir(uploadId), "meta.json");
}

export function createUploadId() {
  return crypto.randomUUID();
}

export async function createChunkSession(input: {
  campaignId: string;
  fileName: string;
  mimeType: string;
  totalSize: number;
  uploadedBy: string;
}): Promise<ChunkUploadSession> {
  const id = createUploadId();
  const totalChunks = Math.max(1, Math.ceil(input.totalSize / DEFAULT_CHUNK_BYTES));
  const session: ChunkUploadSession = {
    id,
    campaignId: input.campaignId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    totalSize: input.totalSize,
    totalChunks,
    receivedChunks: [],
    uploadedBy: input.uploadedBy,
    status: "UPLOADING",
    createdAt: new Date().toISOString()
  };
  await fs.mkdir(sessionDir(id), { recursive: true });
  await fs.writeFile(metaPath(id), JSON.stringify(session, null, 2));
  return session;
}

export async function getChunkSession(uploadId: string): Promise<ChunkUploadSession | null> {
  try {
    const raw = await fs.readFile(metaPath(uploadId), "utf8");
    return JSON.parse(raw) as ChunkUploadSession;
  } catch {
    return null;
  }
}

async function saveSession(session: ChunkUploadSession) {
  await fs.writeFile(metaPath(session.id), JSON.stringify(session, null, 2));
}

export async function saveChunk(uploadId: string, chunkIndex: number, data: Buffer): Promise<ChunkUploadSession> {
  const session = await getChunkSession(uploadId);
  if (!session) throw new Error("Upload session not found");
  if (session.status !== "UPLOADING") throw new Error("Upload session is not accepting chunks");
  if (chunkIndex < 0 || chunkIndex >= session.totalChunks) throw new Error("Invalid chunk index");

  const chunkPath = path.join(sessionDir(uploadId), `${chunkIndex}.part`);
  await fs.writeFile(chunkPath, data);

  if (!session.receivedChunks.includes(chunkIndex)) {
    session.receivedChunks.push(chunkIndex);
    session.receivedChunks.sort((a, b) => a - b);
    await saveSession(session);
  }
  return session;
}

export async function mergeChunks(uploadId: string): Promise<Buffer> {
  const session = await getChunkSession(uploadId);
  if (!session) throw new Error("Upload session not found");

  if (session.receivedChunks.length !== session.totalChunks) {
    throw new Error(`Missing chunks: ${session.receivedChunks.length}/${session.totalChunks}`);
  }

  session.status = "MERGING";
  await saveSession(session);

  const parts: Buffer[] = [];
  for (let i = 0; i < session.totalChunks; i++) {
    parts.push(await fs.readFile(path.join(sessionDir(uploadId), `${i}.part`)));
  }
  const merged = Buffer.concat(parts);

  session.status = "COMPLETE";
  await saveSession(session);
  return merged;
}

export async function deleteChunkSession(uploadId: string) {
  await fs.rm(sessionDir(uploadId), { recursive: true, force: true });
}
