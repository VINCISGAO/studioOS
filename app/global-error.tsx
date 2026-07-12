"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  function handleRetry() {
    if (typeof reset === "function") {
      reset();
      return;
    }
    window.location.reload();
  }

  return (
    <html lang="zh">
      <body className="min-h-screen bg-zinc-950 text-white antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-xl font-semibold">服务器错误</h1>
          <p className="max-w-md text-sm text-zinc-400">
            {error.message || "Internal Server Error"}
          </p>
          {error.digest ? (
            <p className="font-mono text-xs text-zinc-600">digest: {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
          >
            重试
          </button>
        </main>
      </body>
    </html>
  );
}
