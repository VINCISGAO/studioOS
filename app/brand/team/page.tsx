import { Card, CardContent } from "@/components/ui/card";
import { getLocale, type SearchParams } from "@/lib/i18n";

export default async function BrandTeamPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{locale === "zh" ? "团队" : "Team"}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh"
          ? "邀请同事查看 Campaign、审片与账单。"
          : "Invite teammates to view campaigns, review cuts, and billing."}
      </p>
      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-8 text-center text-sm text-zinc-500">
          {locale === "zh" ? "团队权限与席位管理即将上线。" : "Team seats and permissions coming soon."}
        </CardContent>
      </Card>
    </div>
  );
}
