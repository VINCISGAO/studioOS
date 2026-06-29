import { Resend } from "resend";

let client: Resend | null | undefined;

export function getResend(): Resend | null {
  if (client !== undefined) {
    return client;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    client = null;
    return null;
  }

  client = new Resend(apiKey);
  return client;
}
