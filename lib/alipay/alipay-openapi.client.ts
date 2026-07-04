import "server-only";

import crypto from "node:crypto";

function formatTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function signContent(content: string, privateKeyPem: string) {
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(content, "utf8");
  signer.end();
  return signer.sign(privateKeyPem, "base64");
}

export async function callAlipayOpenApi(input: {
  gatewayUrl: string;
  appId: string;
  privateKey: string;
  method: string;
  params?: Record<string, string>;
  bizContent?: Record<string, unknown>;
}) {
  const payload: Record<string, string> = {
    app_id: input.appId,
    method: input.method,
    format: "json",
    charset: "utf-8",
    sign_type: "RSA2",
    version: "1.0",
    timestamp: formatTimestamp(new Date()),
    ...(input.params ?? {})
  };

  if (input.bizContent) {
    payload.biz_content = JSON.stringify(input.bizContent);
  }

  const signBase = Object.keys(payload)
    .sort()
    .filter((key) => payload[key] !== "")
    .map((key) => `${key}=${payload[key]}`)
    .join("&");

  payload.sign = signContent(signBase, input.privateKey);

  const url = `${input.gatewayUrl}?${new URLSearchParams(payload).toString()}`;
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  const json = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok || !json) {
    throw new Error("Alipay API request failed");
  }

  const errorNode = json.error_response;
  if (errorNode && typeof errorNode === "object") {
    const message =
      "sub_msg" in errorNode && typeof errorNode.sub_msg === "string"
        ? errorNode.sub_msg
        : "msg" in errorNode && typeof errorNode.msg === "string"
          ? errorNode.msg
          : "Alipay API error";
    throw new Error(message);
  }

  return json;
}
