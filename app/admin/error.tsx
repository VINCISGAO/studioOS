"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  useEffect(() => {
    console.error("[VINCIS admin error]", error);
  }, [error]);

  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  function handleRetry() {
    if (typeof reset === "function") {
      reset();
      return;
    }
    window.location.reload();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center text-white">
      <h1 className="text-xl font-semibold">管理后台加载出错</h1>
      <p className="max-w-md text-sm text-zinc-400">
        {isLocal
          ? "本地开发请先运行 npm run dev:fix，并确保终端里 dev 服务一直在运行。"
          : "生产环境请检查 Vercel 函数日志、数据库连接与 AUTH_SECURITY_SECRET 配置，然后重试或重新登录。"}
      </p>
      {error.message ? (
        <pre className="max-w-lg overflow-x-auto rounded-lg bg-red-950/50 px-3 py-2 text-left text-xs text-red-300">
          {error.message}
        </pre>
      ) : error.digest ? (
        <pre className="max-w-lg overflow-x-auto rounded-lg bg-red-950/50 px-3 py-2 text-left text-xs text-red-300">
          digest: {error.digest}
        </pre>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleRetry}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          重试
        </button>
        <Link
          href="/admin/login"
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
        >
          返回登录
        </Link>
      </div>
    </main>
  );
}
