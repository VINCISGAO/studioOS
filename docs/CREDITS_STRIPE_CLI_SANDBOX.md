# VINCIS Credits — Stripe CLI Sandbox E2E

Use Stripe test mode + Stripe CLI against your local webhook endpoint. Webhook signature verification must continue to use the **raw request body** (`app/api/v1/webhooks/stripe/route.ts`).

## Prerequisites

```bash
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_...
npm run dev
stripe login
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

Keep `stripe listen` running in a separate terminal. Copy the displayed `whsec_...` into `STRIPE_WEBHOOK_SECRET` for local verification.

## Scenarios

### 1. Normal card payment

1. Open `/studio/credits` as a creator.
2. Buy a package with test card `4242 4242 4242 4242`.
3. Expect `checkout.session.completed` with `payment_status=paid`.
4. Order status → `CREDITED`, wallet balance increases once.

### 2. Duplicate webhook delivery

```bash
stripe events resend evt_...
```

Run twice for the same `checkout.session.completed` event. Credits must only be granted once (`duplicate: true` on second delivery).

### 3. Checkout session expired

Create checkout, abandon it, then trigger expiration from Dashboard or wait for expiry.

Expect `checkout.session.expired` → order `CANCELLED`, no credits.

### 4. Async payment succeeded

Use an async test payment method (e.g. bank debit / delayed methods enabled in Checkout).

Flow:

- `checkout.session.completed` with `payment_status=unpaid` → **deferred**, no credit yet
- `checkout.session.async_payment_succeeded` → idempotent credit

### 5. Async payment failed

Use a failing async method or simulate failure.

Expect `checkout.session.async_payment_failed` → order `FAILED`, no credits.

### 6. Partial refund

After a credited order, issue a partial refund in Dashboard.

Expect `charge.refunded`:

- `totalRefundedMinor` updated cumulatively
- Only incremental credits clawed back
- Order status → `PARTIALLY_REFUNDED`

### 7. Second partial refund

Issue another partial refund on the same charge.

Expect another delta clawback; duplicate refund event IDs must not double-claw.

### 8. Full refund

Refund remaining amount until `amount_refunded == amountMinor`.

Expect order status → `REFUNDED`.

### 9. Refund with insufficient credit balance

Spend most credits via generation, then refund the purchase.

Expect partial clawback + `shortfall` metadata in ledger; no negative wallet balance.

### 10. Dispute opened / closed

From Dashboard → Payments → dispute a charge.

Expect:

- `charge.dispute.created` → order `DISPUTED`, related credits held, `purchaseBlocked=true`
- `charge.dispute.closed` with `won` → held credits released
- `charge.dispute.closed` with `lost` → held credits forfeited

## Automated repository checks

```bash
npm run db:migrate:deploy
npm run credits:stripe:verify
npm run credits:conversion:verify
npm run credits:verify
```

## Notes

- Never disable webhook signature verification in production.
- Credit purchase metadata must include `type=credit_package_purchase`, `user_id`, `order_id`.
- Refund clawback is proportional: `floor(totalCredits * cumulativeRefundedMinor / amountMinor) - creditsClawedBack`.
