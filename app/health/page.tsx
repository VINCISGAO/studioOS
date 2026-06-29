export default function HealthPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        gap: 12
      }}
    >
      <h1 style={{ fontSize: 28, margin: 0 }}>StudioOS 本地服务正常</h1>
      <p style={{ color: "#666", margin: 0 }}>dev server is running.</p>
      <a href="/?lang=zh" style={{ color: "#2563eb" }}>
        进入首页 →
      </a>
    </main>
  );
}
