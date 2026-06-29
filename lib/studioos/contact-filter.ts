/** Block off-platform contact exchange until escrow payment. */
const CONTACT_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(?:whatsapp|wa\.me)\b/gi, label: "WhatsApp" },
  { pattern: /\btelegram\b/gi, label: "Telegram" },
  { pattern: /\bt\.me\/\S+/gi, label: "Telegram" },
  { pattern: /微信|wechat|weixin/gi, label: "WeChat" },
  { pattern: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, label: "email" },
  { pattern: /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}\b/g, label: "phone" }
];

export type ContactFilterResult = {
  text: string;
  blocked: boolean;
  reasons: string[];
};

export function filterContactInfo(body: string, allowContacts: boolean): ContactFilterResult {
  if (allowContacts) {
    return { text: body, blocked: false, reasons: [] };
  }

  let text = body;
  const reasons = new Set<string>();
  let blocked = false;

  for (const { pattern, label } of CONTACT_PATTERNS) {
    if (pattern.test(text)) {
      blocked = true;
      reasons.add(label);
      text = text.replace(pattern, `[${label} hidden until payment]`);
      pattern.lastIndex = 0;
    }
  }

  return { text, blocked, reasons: [...reasons] };
}

export function contactFilterNotice(locale: "en" | "zh", reasons: string[]): string {
  if (locale === "zh") {
    return `平台已隐藏站外联系方式（${reasons.join("、")}）。付款进入托管后可讨论线下协作。`;
  }
  return `Off-platform contact (${reasons.join(", ")}) hidden until escrow payment.`;
}
