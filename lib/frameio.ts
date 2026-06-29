import { createHmac, timingSafeEqual } from "crypto";
import {
  frameIoAccountId,
  frameIoApiBase,
  frameIoWorkspaceId,
  frameIoWebhookSecret,
  hasFrameIoConfig,
  isFrameIoDemoMode
} from "@/lib/frameio-config";

type FrameTokenResponse = {
  access_token: string;
  expires_in: number;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

function demoId(prefix: string) {
  return `${prefix}_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function getFrameAccessToken(): Promise<string> {
  if (isFrameIoDemoMode()) {
    return "frameio_demo_token";
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.FRAME_IO_CLIENT_ID!;
  const clientSecret = process.env.FRAME_IO_CLIENT_SECRET!;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "AdobeID,openid,frame.io_api"
  });

  const res = await fetch("https://ims-na1.adobelogin.com/ims/token/v3", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Frame.io token error: ${res.status} ${error}`);
  }

  const json = (await res.json()) as FrameTokenResponse;
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000
  };
  return json.access_token;
}

export async function frameFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  if (isFrameIoDemoMode()) {
    throw new Error("frameFetch called in demo mode — use demo helpers instead");
  }

  const token = await getFrameAccessToken();
  const res = await fetch(`${frameIoApiBase()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Frame.io API Error: ${res.status} ${error}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export type FrameProjectResult = {
  projectId: string;
  folderId: string;
};

export async function createFrameProject(input: {
  title: string;
}): Promise<FrameProjectResult> {
  if (isFrameIoDemoMode()) {
    return {
      projectId: demoId("proj"),
      folderId: demoId("folder")
    };
  }

  const accountId = frameIoAccountId();
  const workspaceId = frameIoWorkspaceId();

  const project = await frameFetch<{ id: string; root_folder_id?: string }>(
    `/v4/accounts/${accountId}/workspaces/${workspaceId}/projects`,
    {
      method: "POST",
      body: JSON.stringify({ name: input.title })
    }
  );

  return {
    projectId: project.id,
    folderId: project.root_folder_id ?? project.id
  };
}

export type FrameUploadResult = {
  assetId: string;
  reviewLink: string;
};

export async function uploadFrameAsset(input: {
  folderId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileBuffer: Buffer;
}): Promise<FrameUploadResult> {
  if (isFrameIoDemoMode()) {
    const assetId = demoId("asset");
    return {
      assetId,
      reviewLink: `https://app.frame.io/reviews/demo-${assetId}`
    };
  }

  const accountId = frameIoAccountId();

  const uploadIntent = await frameFetch<{
    id: string;
    upload_urls: string[];
    review_link?: { url: string };
  }>(`/v4/accounts/${accountId}/assets/upload`, {
    method: "POST",
    body: JSON.stringify({
      name: input.fileName,
      filesize: input.fileSize,
      filetype: input.mimeType,
      parent_id: input.folderId
    })
  });

  const uploadUrl = uploadIntent.upload_urls?.[0];
  if (!uploadUrl) {
    throw new Error("Frame.io did not return an upload URL");
  }

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": input.mimeType },
    body: input.fileBuffer
  });

  if (!putRes.ok) {
    throw new Error(`Frame.io upload failed: ${putRes.status}`);
  }

  const reviewLink =
    uploadIntent.review_link?.url ??
    `https://app.frame.io/reviews/${uploadIntent.id}`;

  return {
    assetId: uploadIntent.id,
    reviewLink
  };
}

export function verifyFrameIoWebhookSignature(rawBody: string, signatureHeader: string | null) {
  const secret = frameIoWebhookSecret();
  if (!secret) {
    return isFrameIoDemoMode();
  }

  if (!signatureHeader) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.replace(/^sha256=/, "");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

export function isFrameIoConfiguredForProduction() {
  return hasFrameIoConfig();
}
