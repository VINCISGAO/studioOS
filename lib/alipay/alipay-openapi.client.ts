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

function buildSignedPayload(input: {
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
  return payload;
}

export function buildAlipaySignedGatewayUrl(input: {
  gatewayUrl: string;
  appId: string;
  privateKey: string;
  method: string;
  params?: Record<string, string>;
  bizContent?: Record<string, unknown>;
}) {
  const payload = buildSignedPayload(input);
  return `${input.gatewayUrl}?${new URLSearchParams(payload).toString()}`;
}

export async function callAlipayOpenApi(input: {
  gatewayUrl: string;
  appId: string;
  privateKey: string;
  method: string;
  params?: Record<string, string>;
  bizContent?: Record<string, unknown>;
}) {
  const payload = buildSignedPayload(input);
  const url = `${input.gatewayUrl}?${new URLSearchParams(payload).toString()}`;
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  const json = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok || !json) {
    throw new Error("Alipay API request failed");
  }

  const errorNode = json.error_response;
  if (errorNode && typeof errorNode === "object") {
    throw new Error(formatAlipayError(errorNode));
  }

  const businessError = findAlipayBusinessError(json);
  if (businessError) {
    throw new Error(businessError);
  }

  return json;
}

function formatAlipayError(errorNode: Record<string, unknown>) {
  const subMsg = typeof errorNode.sub_msg === "string" ? errorNode.sub_msg : "";
  const msg = typeof errorNode.msg === "string" ? errorNode.msg : "Alipay API error";
  const subCode = typeof errorNode.sub_code === "string" ? errorNode.sub_code : "";
  return [subMsg || msg, subCode ? `(${subCode})` : ""].filter(Boolean).join(" ");
}

function findAlipayBusinessError(json: Record<string, unknown>) {
  for (const value of Object.values(json)) {
    if (!value || typeof value !== "object") continue;
    const node = value as Record<string, unknown>;
    const code = node.code;
    if (code === "10000" || code === 10000) continue;
    if (typeof code === "string" || typeof code === "number") {
      return formatAlipayError(node);
    }
  }
  return null;
}
