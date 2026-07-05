# VINCIS Admin Backend V1

Prisma-backed admin console for VINCIS operations (Night Mode P1).

**Last updated:** 2026-07-01

---

## Routes

| Route | Purpose | Data source |
|-------|---------|-------------|
| `/admin` | Platform overview (legacy JSON preview + Prisma ops links) | Mixed |
| `/admin/dashboard` | Prisma analytics (GMV, revenue, fees, charts) | Prisma |
| `/admin/campaigns` | Campaign list with filters | Prisma |
| `/admin/campaigns/[id]` | Detail: versions, review, escrow, settlement, wallet, ledger, activity, notifications | Prisma |
| `/admin/settlements` | Settlement queue | Prisma + `settlementService.resolveState` |
| `/admin/withdrawals` | Withdrawal approval queue | Prisma `WITHDRAW_REQUEST` |
| `/admin/wallets` | Wallet list | Prisma |
| `/admin/wallets/[userId]` | Wallet detail + manual adjustment | Prisma + LedgerService |
| `/admin/ledger` | Ledger explorer | Prisma `LedgerEntry` |
| `/admin/payments` | EscrowPayment + OrderCommission + Webhooks | Prisma |
| `/admin/notifications` | Notification center | Prisma |
| `/admin/activity-log` | Activity log explorer | Prisma `ActivityLog` |
| `/admin/audit` | Legacy audit view (links to activity-log) | Prisma |

---

## Architecture

```
UI (app/admin/*)
  → app/admin-actions.ts (server actions)
    → features/admin/*Service (permissions, orchestration)
      → features/admin/*Repository (queries)
        → Prisma
```

Side effects (ActivityLog) are written in services via `activityLogWriter`, not inline in UI.

---

## Repository / Service Map

| Module | Repository | Service |
|--------|------------|---------|
| Campaign | `features/admin/campaign/admin-campaign.repository.ts` | `features/admin/campaign/admin-campaign.service.ts` |
| Settlement | `features/admin/settlement/admin-settlement.repository.ts` | `features/admin/settlement/admin-settlement.service.ts` |
| Withdrawal | `features/admin/withdrawal/admin-withdrawal.repository.ts` | `features/admin/withdrawal/admin-withdrawal.service.ts` |
| Wallet | `features/admin/wallet/admin-wallet.repository.ts` | `features/admin/wallet/admin-wallet.service.ts` |
| Ledger | `features/admin/ledger/admin-ledger.repository.ts` | `features/admin/ledger/admin-ledger.service.ts` |
| Payment | `features/admin/payment/admin-payment.repository.ts` | `features/admin/payment/admin-payment.service.ts` |
| Notification | `features/admin/notification/admin-notification.repository.ts` | `features/admin/notification/admin-notification.service.ts` |
| Activity log | — | `features/admin/admin-activity-log.service.ts` |
| Dashboard | `features/admin/dashboard/admin-dashboard.repository.ts` | `features/admin/dashboard/admin-dashboard.service.ts` |
| Dispute | — | `features/admin/dispute.service.ts` |

---

## Server Actions (`app/admin-actions.ts`)

| Action | Service | Revalidates |
|--------|---------|-------------|
| `resolveDisputeAction` | `disputeService.resolve` | disputes |
| `releaseSettlementAction` | `adminSettlementService.releaseSettlement` | settlements |
| `retrySettlementAction` | `adminSettlementService.retryRelease` | settlements |
| `freezeSettlementAction` | `adminSettlementService.freezeSettlement` | settlements |
| `cancelSettlementAction` | `adminSettlementService.cancelSettlement` | settlements |
| `approveWithdrawalAction` | `adminWithdrawalService.approve` → `withdrawService.completeWithdraw` | withdrawals |
| `rejectWithdrawalAction` | `adminWithdrawalService.reject` | withdrawals |
| `adjustWalletAction` | `adminWalletService.manualAdjust` | wallets + wallet detail |
| `retryNotificationAction` | `adminNotificationService.retry` | notifications |

---

## API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/admin/ledger/export` | CSV export of filtered ledger entries (auth + `admin.ledger.read`) |

---

## Permission Matrix

| Permission | ADMIN | SUPPORT | Description |
|------------|-------|---------|-------------|
| `admin.campaign.manage` | ✓ | — | Campaign list/detail |
| `admin.settlement.manage` | ✓ | — | Settlement queue actions |
| `admin.wallet.manage` | ✓ | — | Wallets + withdrawals |
| `admin.ledger.read` | ✓ | ✓ | Ledger explorer + export |
| `admin.notification.read` | ✓ | ✓ | Notification center |
| `admin.payment.manage` | ✓ | — | Payments console |
| `admin.audit.read` | ✓ | ✓ | Activity log / audit |
| `admin.overview.read` | ✓ | — | Analytics dashboard |

---

## Settlement Queue States

Display states (admin queue):

| State | Meaning |
|-------|---------|
| **READY** | Delivery approved, escrow releasable |
| **LOCKED** | Delivery locked, not yet READY |
| **RELEASED** | Settlement completed |
| **FAILED** | `BLOCKED` settlement state |
| **DISPUTE** | Open dispute on campaign |

Actions: **Release** (READY), **Retry** (FAILED/LOCKED), **Freeze**, **Cancel**.

Legacy project ID: `productionBrief.legacy_project_id`.

---

## Navigation

- Route constants: `lib/studioos/admin-portal-routes.ts`
- Shell: `components/studioos/admin-portal-shell.tsx`

### Primary sidebar (P1)

Overview · Analytics · Campaigns · Payments · Escrow/Settlement · Withdrawals · Wallets · Ledger · Notifications · Activity Log · Disputes

### Legacy sidebar

Brands · Projects · Studios · Membership · Audit · Flags · Quality · Support

Mobile nav icon keys extended in `lib/studioos/portal-mobile-nav-types.ts`.

---

## Data Tables

- `Campaign`, `CampaignVersion`, `ReviewComment`, `CampaignDelivery`
- `EscrowPayment`, `OrderCommission`, `WebhookEvent`
- `Wallet`, `WalletAccount`, `WalletAsset`, `Transaction`
- `LedgerEntry`, `PaymentMethod`
- `Notification`, `ActivityLog`, `Dispute`

---

## Session Commits (recommended grouping)

When committing locally, use semantic messages per module:

1. `fix(brand): settlement page legacy project id links`
2. `feat(admin): full portal shell navigation for P1 modules`
3. `fix(review): wire ReviewCenterCommentPanel in FrameioReviewCenter`
4. `docs: update v1 final report and admin backend v1`

---

## Known Limitations

- `/admin` overview still reads legacy `lib/data` for orders/projects preview.
- Wallet manual adjust writes ActivityLog only when user has a related campaign.
- Withdrawal approve immediately marks paid (`WITHDRAW_SUCCESS`); no intermediate "approved pending transfer" state.
- Dashboard pending-withdrawal count uses transaction scan (approximate).
