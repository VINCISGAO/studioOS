import "server-only";

const ORIGIN = "https://vincis.app";

export type KnowledgeSearchEnginePingResult = {
  attempted: string[];
  succeeded: string[];
  skipped: string[];
};

async function pingUrl(url: string, label: string, result: KnowledgeSearchEnginePingResult) {
  result.attempted.push(label);
  try {
    const response = await fetch(url, { method: "GET", signal: AbortSignal.timeout(8000) });
    if (response.ok) {
      result.succeeded.push(label);
      return;
    }
  } catch {
    // Best-effort ping — publish pipeline must not fail on external notification errors.
  }
}

export async function pingKnowledgeSearchEngines(input?: { articleUrls?: string[] }) {
  const result: KnowledgeSearchEnginePingResult = {
    attempted: [],
    succeeded: [],
    skipped: []
  };

  const sitemapUrl = `${ORIGIN}/sitemap.xml`;
  await pingUrl(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, "google_sitemap", result);
  await pingUrl(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, "bing_sitemap", result);
  await pingUrl(`https://ping.baidu.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, "baidu_sitemap", result);

  const indexNowKey = process.env.VINCIS_INDEXNOW_KEY?.trim();
  if (indexNowKey && input?.articleUrls?.length) {
    result.attempted.push("indexnow");
    try {
      const response = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: "vincis.app",
          key: indexNowKey,
          keyLocation: `${ORIGIN}/${indexNowKey}.txt`,
          urlList: input.articleUrls.map((path) => `${ORIGIN}${path}`)
        }),
        signal: AbortSignal.timeout(8000)
      });
      if (response.ok) result.succeeded.push("indexnow");
    } catch {
      // ignore
    }
  } else {
    result.skipped.push("indexnow");
  }

  return result;
}
