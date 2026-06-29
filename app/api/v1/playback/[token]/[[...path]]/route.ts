import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/database/prisma";
import {
  resolveHlsStorageKey,
  signedPlaybackSegmentUrl,
  verifyPlaybackToken
} from "@/features/video/playback-token.service";
import { getObject } from "@/lib/studioos/object-storage";
import { videoConfig } from "@/lib/core/config/video";
import { hlsManifestFilePath } from "@/lib/studioos/video-version-upload";
import { promises as fs } from "fs";

function mimeForFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "m3u8") return "application/vnd.apple.mpegurl";
  if (ext === "ts") return "video/mp2t";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function rewriteManifest(body: string, token: string) {
  return body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return line;
      return signedPlaybackSegmentUrl(token, trimmed);
    })
    .join("\n");
}

async function loadSegment(storageKey: string, fileName: string, demoUrl?: string | null) {
  if (demoUrl?.startsWith("http")) {
    const res = await fetch(demoUrl);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }

  const objectKey = `${storageKey}/${fileName}`;
  const fromObject = await getObject(objectKey);
  if (fromObject) return fromObject;

  const parts = storageKey.replace(/^hls\//, "").split("/");
  if (parts.length >= 2) {
    const localPath = hlsManifestFilePath(parts[0], Number(parts[1])).replace(
      "index.m3u8",
      fileName
    );
    try {
      return await fs.readFile(localPath);
    } catch {
      return null;
    }
  }
  return null;
}

type Params = { params: Promise<{ token: string; path?: string[] }> };

export async function GET(_request: Request, { params }: Params) {
  const { token, path: segments } = await params;
  const payload = verifyPlaybackToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired playback token" }, { status: 403 });
  }

  const version = await prisma.campaignVersion.findUnique({
    where: { id: payload.v },
    select: {
      id: true,
      campaignId: true,
      versionNumber: true,
      hlsUrl: true,
      deletedAt: true
    }
  });

  if (!version || version.deletedAt || version.campaignId !== payload.c) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const fileName = segments?.length ? segments.join("/").replace(/\.\./g, "") : "index.m3u8";
  const storageKey = resolveHlsStorageKey({
    campaignId: version.campaignId,
    versionNumber: version.versionNumber,
    hlsUrl: version.hlsUrl
  });

  if (version.hlsUrl?.startsWith("http") && fileName === "index.m3u8") {
    const res = await fetch(version.hlsUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "HLS manifest unavailable" }, { status: 502 });
    }
    const text = await res.text();
    return new NextResponse(rewriteManifest(text, token), {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "private, no-store"
      }
    });
  }

  const data = await loadSegment(storageKey, fileName, version.hlsUrl);
  if (!data) {
    return NextResponse.json({ error: "Playback asset not found" }, { status: 404 });
  }

  if (fileName.endsWith(".m3u8")) {
    const rewritten = rewriteManifest(data.toString("utf8"), token);
    return new NextResponse(rewritten, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "private, no-store"
      }
    });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": mimeForFile(fileName),
      "Cache-Control": `private, max-age=${videoConfig.tokenTtlSec}`
    }
  });
}
