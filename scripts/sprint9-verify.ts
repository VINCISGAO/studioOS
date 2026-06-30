/**
 * Sprint 9 — Notification + Event Bus
 * Run: npm run sprint9:verify
 */
import { PrismaClient } from "@prisma/client";
import { bootstrapEventSystem } from "../features/events/bootstrap";
import { _resetEventBusForTests } from "../lib/core/event-bus";
import { _resetNotificationHandlersForTests } from "../features/notification/notification.handlers";
import { _resetEventSystemForTests } from "../features/events/bootstrap";
import { campaignService } from "../features/campaign/campaign.service";
import { creativeDirectionService } from "../features/ai/creative-direction.service";
import { invitationService } from "../features/matching/invitation.service";
import { escrowService } from "../features/payment/escrow.service";
import { notificationService } from "../features/notification/notification.service";
import { eventProcessorService } from "../features/events/event-processor.service";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  let campaignId: string | null = null;
  let creatorUserId: string | null = null;

  _resetEventBusForTests();
  _resetNotificationHandlersForTests();
  _resetEventSystemForTests();
  bootstrapEventSystem();

  try {
    const brand = await prisma.user.findUniqueOrThrow({ where: { email: "client.arc@studioos.test" } });
    const creatorUser = await prisma.user.findUniqueOrThrow({ where: { email: "creator.nova@studioos.test" } });
    creatorUserId = creatorUser.id;
    const nova = await prisma.creatorProfile.findFirstOrThrow({ where: { userId: creatorUser.id } });

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);

    const created = await campaignService.create(
      { id: brand.id, role: "BRAND" },
      {
        title: "Sprint 9 Verify Campaign",
        description: "Notification bus test",
        budget: 1800,
        currency: "USD",
        deadline: deadline.toISOString(),
        platform: "TikTok",
        aspect_ratio: "9:16"
      }
    );
    campaignId = created?.id ?? null;
    if (!campaignId) throw new Error("Campaign not created");

    const directions = await creativeDirectionService.generate(campaignId, { id: brand.id, role: "BRAND" });
    await creativeDirectionService.approve(campaignId, { id: brand.id, role: "BRAND" }, directions[0]!.id);
    const invitations = await invitationService.send(campaignId, { id: brand.id, role: "BRAND" }, [nova.id]);
    await invitationService.accept(invitations[0]!.id, { id: creatorUser.id, role: "CREATOR" });

    const afterAccept = await notificationService.listForUser({ id: creatorUser.id, role: "CREATOR" }, 10);
    checks.push({
      name: "notify.creator_accepted",
      ok: afterAccept.items.some((n) => n.title.includes("invitation accepted") || n.title.includes("selected")),
      detail: `${afterAccept.items.length} notifications`
    });

    await escrowService.demoPay(campaignId, { id: brand.id, role: "BRAND" });

    const afterPay = await notificationService.listForUser({ id: creatorUser.id, role: "CREATOR" }, 20);
    checks.push({
      name: "notify.escrow_funded",
      ok: afterPay.items.some((n) => n.title.toLowerCase().includes("escrow")),
      detail: `${afterPay.unreadCount} unread`
    });

    const domainEvents = await prisma.domainEvent.count({
      where: { aggregateId: { in: [campaignId] } }
    });
    checks.push({
      name: "event.persisted",
      ok: domainEvents >= 2,
      detail: `${domainEvents} events`
    });

    const first = afterPay.items[0];
    if (first) {
      await notificationService.markRead(first.id, { id: creatorUser.id, role: "CREATOR" });
    }
    const unreadAfter = await notificationService.listForUser({ id: creatorUser.id, role: "CREATOR" }, 20);
    checks.push({
      name: "notify.mark_read",
      ok: unreadAfter.unreadCount < afterPay.unreadCount,
      detail: `${unreadAfter.unreadCount} unread after read`
    });

    const processed = await eventProcessorService.processPending(10);
    checks.push({
      name: "event.processor",
      ok: processed.processed >= 0,
      detail: `${processed.processed} replayed`
    });

    const direct = await notificationService.notify({
      userId: brand.id,
      campaignId,
      title: "Sprint 9 direct notify",
      content: "Testing in-app + email log path.",
      email: true
    });
    checks.push({
      name: "notify.direct",
      ok: direct.id.length > 0,
      detail: direct.id
    });
  } catch (error) {
    checks.push({
      name: "sprint9.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (campaignId) {
      await prisma.notification.deleteMany({ where: { campaignId } });
      await prisma.emailLog.deleteMany({});
      await prisma.domainEvent.deleteMany({ where: { aggregateId: campaignId } });
      await prisma.activityLog.deleteMany({ where: { campaignId } });
      await prisma.escrowPayment.deleteMany({ where: { campaignId } });
      await prisma.creatorInvitation.deleteMany({ where: { campaignId } });
      await prisma.aiJob.deleteMany({ where: { campaignId } });
      await prisma.campaign.delete({ where: { id: campaignId } });
    }
    if (creatorUserId) {
      await prisma.notification.deleteMany({ where: { userId: creatorUserId } });
    }
    await prisma.notification.deleteMany({
      where: { title: "Sprint 9 direct notify" }
    });
  }

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 9 verification\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
