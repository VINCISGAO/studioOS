import { Badge } from "@/components/ui/badge";
import { hasMetaAds, hasOpenAI, hasTikTokAds } from "@/lib/studioos/config";
import type { Locale } from "@/lib/i18n";

type IntegrationStatusProps = {
  locale: Locale;
  show: ("openai" | "ffprobe" | "meta" | "tiktok")[];
};

export function IntegrationStatus({ locale, show }: IntegrationStatusProps) {
  const items = [
    {
      id: "openai" as const,
      label: "OpenAI Copilot",
      active: hasOpenAI()
    },
    {
      id: "ffprobe" as const,
      label: "ffprobe Quality",
      active: process.env.STUDIOOS_DISABLE_FFPROBE !== "1"
    },
    {
      id: "meta" as const,
      label: "Meta Ads API",
      active: hasMetaAds()
    },
    {
      id: "tiktok" as const,
      label: "TikTok Ads API",
      active: hasTikTokAds()
    }
  ].filter((item) => show.includes(item.id));

  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-200/80 bg-white px-4 py-3">
      <span className="text-xs font-medium text-zinc-500">
        {locale === "zh" ? "集成状态" : "Integrations"}
      </span>
      {items.map((item) => (
        <Badge key={item.id} variant={item.active ? "success" : "secondary"}>
          {item.label} · {item.active ? (locale === "zh" ? "已连接" : "Connected") : locale === "zh" ? "演示" : "Demo"}
        </Badge>
      ))}
    </div>
  );
}
