"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[StudioOS page error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center text-white">
      <h1 className="text-xl font-semibold">页面加载出错</h1>
      <p className="max-w-md text-sm text-zinc-400">
        本地开发请先运行 <code className="rounded bg-zinc-800 px-1.5 py-0.5">npm run dev:fix</code>，
        并确保终端里 dev 服务一直在运行。
      </p>
      {error.message ? (
        <pre className="max-w-lg overflow-x-auto rounded-lg bg-red-950/50 px-3 py-2 text-left text-xs text-red-300">
          {error.message}
        </pre>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        重试
      </button>
    </main>
  );
}
