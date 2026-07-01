/**
 * One-off verifier: brand approve delivery → escrow release → creator notifications.
 * Restores order + notification stores from backup after run.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, ".data");
const orderPath = path.join(dataDir, "order-store.json");
const notifyPath = path.join(dataDir, "notification-store.json");
const backupDir = path.join(dataDir, ".verify-backup");

function backup() {
  mkdirSync(backupDir, { recursive: true });
  copyFileSync(orderPath, path.join(backupDir, "order-store.json"));
  copyFileSync(notifyPath, path.join(backupDir, "notification-store.json"));
}

function restore() {
  copyFileSync(path.join(backupDir, "order-store.json"), orderPath);
  copyFileSync(path.join(backupDir, "notification-store.json"), notifyPath);
}

type OrderStore = {
  orders: Array<{
    id: string;
    creator_id: string;
    status: string;
    payment_status: string;
    payout_status: string;
    completed_at: string | null;
  }>;
};

type NotificationStore = {
  notifications: Array<{
    id: string;
    creator_id: string;
    order_id: string | null;
    type: string;
  }>;
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function writeJson(file: string, data: unknown) {
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  const checks: { name: string; ok: boolean; detail?: string }[] = [];

  if (!existsSync(orderPath) || !existsSync(notifyPath)) {
    console.error("Missing .data stores");
    process.exit(1);
  }

  backup();

  const orderStore = readJson<OrderStore>(orderPath);
  let target = orderStore.orders.find((o) => o.status === "review" || o.status === "revision");

  if (!target) {
    target = orderStore.orders[0];
    if (!target) {
      checks.push({ name: "order candidate", ok: false, detail: "no orders in store" });
      printAndExit(checks);
    }
    target.status = "review";
    target.payment_status = "escrowed";
    target.payout_status = "held";
    target.completed_at = null;
    writeJson(orderPath, orderStore);
    checks.push({ name: "order setup", ok: true, detail: `forced ${target.id} → review` });
  } else {
    checks.push({ name: "order candidate", ok: true, detail: `${target.id} status=${target.status}` });
  }

  const notifyBefore = readJson<NotificationStore>(notifyPath);
  const beforeTypes = notifyBefore.notifications.filter(
    (n) => n.order_id === target!.id && n.creator_id === target!.creator_id
  );

  const { approveOrderDelivery } = await import("../lib/order-service");
  let updated: Awaited<ReturnType<typeof approveOrderDelivery>> = null;
  try {
    updated = await approveOrderDelivery(target.id);
    checks.push({ name: "approveOrderDelivery", ok: updated !== null, detail: updated ? "ok" : "returned null" });
  } catch (error) {
    checks.push({
      name: "approveOrderDelivery",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
    restore();
    printAndExit(checks);
  }

  if (updated) {
    checks.push({
      name: "order.status",
      ok: updated.status === "completed",
      detail: updated.status
    });
    checks.push({
      name: "order.payment_status",
      ok: updated.payment_status === "released",
      detail: updated.payment_status
    });
    checks.push({
      name: "order.payout_status",
      ok: updated.payout_status === "paid",
      detail: updated.payout_status
    });
  }

  const notifyAfter = readJson<NotificationStore>(notifyPath);
  const forOrder = notifyAfter.notifications.filter(
    (n) => n.order_id === target!.id && n.creator_id === target!.creator_id
  );
  const newOnes = forOrder.filter(
    (n) => !beforeTypes.some((b) => b.id === n.id && b.type === n.type)
  );

  const deliveryApproved = forOrder.some((n) => n.type === "delivery_approved");
  const escrowReleased = forOrder.some((n) => n.type === "escrow_released");

  checks.push({
    name: "notification delivery_approved",
    ok: deliveryApproved,
    detail: deliveryApproved ? "found" : "missing"
  });
  checks.push({
    name: "notification escrow_released",
    ok: escrowReleased,
    detail: escrowReleased ? "found" : "missing"
  });
  checks.push({
    name: "new notifications created",
    ok: newOnes.some((n) => n.type === "delivery_approved") && newOnes.some((n) => n.type === "escrow_released"),
    detail: newOnes.map((n) => n.type).join(", ") || "none"
  });

  restore();
  checks.push({ name: "store restored", ok: true });

  printAndExit(checks);
}

function printAndExit(checks: { name: string; ok: boolean; detail?: string }[]) {
  let failed = 0;
  for (const check of checks) {
    const mark = check.ok ? "PASS" : "FAIL";
    if (!check.ok) failed += 1;
    console.log(`${mark}  ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  try {
    restore();
  } catch {
    /* ignore */
  }
  console.error(error);
  process.exit(1);
});
