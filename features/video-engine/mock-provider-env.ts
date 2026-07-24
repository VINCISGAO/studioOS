/** Mock provider availability — never enabled in production. */
export function isMockVideoProviderEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  if (process.env.NODE_ENV === "test") {
    return false;
  }
  return (
    process.env.NODE_ENV === "development" &&
    process.env.VIDEO_ENGINE_MOCK_PROVIDER === "1"
  );
}
