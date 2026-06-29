export function hasFrameIoConfig() {
  return Boolean(
    process.env.FRAME_IO_CLIENT_ID &&
      process.env.FRAME_IO_CLIENT_SECRET &&
      process.env.FRAME_IO_ACCOUNT_ID
  );
}

export function frameIoApiBase() {
  return process.env.FRAME_IO_API_BASE?.replace(/\/$/, "") || "https://api.frame.io";
}

export function frameIoAccountId() {
  return process.env.FRAME_IO_ACCOUNT_ID ?? "";
}

export function frameIoWorkspaceId() {
  return process.env.FRAME_IO_WORKSPACE_ID ?? "";
}

export function frameIoWebhookSecret() {
  return process.env.FRAME_IO_WEBHOOK_SECRET ?? "";
}

/** Demo mode — simulate Frame.io when credentials are absent. */
export function isFrameIoDemoMode() {
  return !hasFrameIoConfig();
}
