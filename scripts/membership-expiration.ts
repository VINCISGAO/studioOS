/**
 * Membership expiration worker — run daily via cron
 * Run: npm run membership:expire
 */
import { membershipExpirationService } from "../features/membership/membership-expiration.service";

async function main() {
  const expirations = await membershipExpirationService.processExpirations();
  const reminders = await membershipExpirationService.processExpirationReminders();

  console.log(
    JSON.stringify(
      {
        ok: true,
        expirations,
        reminders
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
