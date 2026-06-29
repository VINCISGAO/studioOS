export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { bootstrapEventSystem } = await import("@/features/events/bootstrap");
  bootstrapEventSystem();
}
