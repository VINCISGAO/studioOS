export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { initMonitoring } = await import("@/lib/core/monitoring");
    await initMonitoring();
  } catch {
    // Monitoring is optional — never block app startup.
  }
}
