import type { StoredMessage } from "@/lib/chat-types";
import type { StoredOrder, StoredQuote } from "@/lib/order-types";
import type { StoredInquiry } from "@/lib/chat-types";

export type ProjectContract = {
  budget: number;
  budgetLabel: string;
  deliverables: string;
  style: string;
  revisions: string;
  deliveryDays: number;
  deliveryLabel: string;
  summaryLines: string[];
};

export function buildProjectContract(
  inquiry: StoredInquiry,
  quote: StoredQuote,
  messages: StoredMessage[]
): ProjectContract {
  const commercial = messages
    .filter((m) => m.sender !== "system" && m.kind !== "pitch")
    .slice(-6)
    .map((m) => m.body.slice(0, 120));

  const styleMatch = messages
    .flatMap((m) => m.body.match(/\b(Apple|Nike|Tesla|Luxury|Minimal|UGC|Documentary)\b/gi) ?? [])
    .at(0);

  return {
    budget: quote.amount,
    budgetLabel: `$${quote.amount.toFixed(2)} USD`,
    deliverables: quote.summary || inquiry.message.slice(0, 200),
    style: styleMatch ?? inquiry.budget_range ?? "As discussed in Proposal Room",
    revisions: "2 rounds included",
    deliveryDays: quote.delivery_days,
    deliveryLabel: `${quote.delivery_days} hours/days as quoted`,
    summaryLines: commercial.length ? commercial : [inquiry.message.slice(0, 160)]
  };
}

export type ProposalStage =
  | "brief"
  | "match"
  | "proposal"
  | "contract"
  | "production"
  | "review"
  | "delivery";

export function resolveProposalStage(
  order: StoredOrder | null,
  quote: StoredQuote | null
): ProposalStage {
  if (!order && !quote) return "proposal";
  if (order?.status === "completed") return "delivery";
  if (order && ["review", "revision"].includes(order.status)) return "review";
  if (order && order.payment_status !== "unpaid") return "production";
  if (order || quote) return "contract";
  return "proposal";
}

/** Proposal Room chat locks once production starts (escrow paid). */
export function isProposalChatLocked(order: StoredOrder | null): boolean {
  if (!order) return false;
  return order.payment_status !== "unpaid" || !["waiting_payment"].includes(order.status);
}

/** Contact details allowed after escrow payment. */
export function allowOffPlatformContacts(order: StoredOrder | null): boolean {
  if (!order) return false;
  return order.payment_status === "escrowed" || order.payment_status === "released";
}
