/**
 * Register or update the production Stripe webhook endpoint for VINCIS.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... npm run stripe:webhook:create
 *   STRIPE_WEBHOOK_URL=https://vincis.app/api/v1/webhooks/stripe npm run stripe:webhook:create
 *
 * Prints the signing secret (whsec_...) only when a new endpoint is created.
 */
import { getStripe } from "../lib/stripe";
import {
  STRIPE_WEBHOOK_EVENTS,
  stripeWebhookUrl
} from "../lib/payment/stripe-webhook-events";

function resolveTargetUrl() {
  const explicit = process.env.STRIPE_WEBHOOK_URL?.trim();
  if (explicit) return explicit;

  const appUrl =
    process.env.VINCIS_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://vincis.app";

  return stripeWebhookUrl(appUrl);
}

function eventsMatch(current: string[] | undefined, required: readonly string[]) {
  const normalizedCurrent = [...(current ?? [])].sort();
  const normalizedRequired = [...required].sort();
  if (normalizedCurrent.length !== normalizedRequired.length) return false;
  return normalizedCurrent.every((value, index) => value === normalizedRequired[index]);
}

async function main() {
  const targetUrl = resolveTargetUrl();
  const stripe = getStripe();

  console.log("VINCIS Stripe webhook setup");
  console.log(`Target URL: ${targetUrl}`);
  console.log(`Required events (${STRIPE_WEBHOOK_EVENTS.length}):`);
  for (const event of STRIPE_WEBHOOK_EVENTS) {
    console.log(`  - ${event}`);
  }
  console.log("");

  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  const match = existing.data.find((endpoint) => endpoint.url === targetUrl);

  if (match) {
    if (!eventsMatch(match.enabled_events, STRIPE_WEBHOOK_EVENTS)) {
      const updated = await stripe.webhookEndpoints.update(match.id, {
        enabled_events: [...STRIPE_WEBHOOK_EVENTS],
        disabled: false
      });
      console.log(`Updated existing endpoint ${updated.id}`);
      console.log(`Enabled events: ${updated.enabled_events.join(", ")}`);
    } else {
      console.log(`Endpoint already exists: ${match.id}`);
      console.log("Enabled events already match — no update needed.");
    }

    console.log("");
    console.log("Signing secret is NOT returned for existing endpoints.");
    console.log("In Stripe Dashboard → Developers → Webhooks → select this endpoint:");
    console.log("  • Reveal signing secret, or");
    console.log("  • Roll secret to generate a new whsec_... for Vercel STRIPE_WEBHOOK_SECRET");
    return;
  }

  const created = await stripe.webhookEndpoints.create({
    url: targetUrl,
    enabled_events: [...STRIPE_WEBHOOK_EVENTS],
    description: "VINCIS production payments (credits, escrow, deposits, wallet, revisions, membership)"
  });

  console.log(`Created endpoint: ${created.id}`);
  console.log("");
  console.log("Copy this into Vercel → Project → Settings → Environment Variables:");
  console.log(`STRIPE_WEBHOOK_SECRET=${created.secret}`);
  console.log("");
  console.log("Also ensure STRIPE_SECRET_KEY is set to the matching Stripe account/mode (test vs live).");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
