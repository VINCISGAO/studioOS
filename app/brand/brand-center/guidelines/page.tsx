import { getAppUiLocale } from "@/lib/app-language";
import { Card, CardContent } from "@/components/ui/card";
import { type SearchParams } from "@/lib/i18n";

export default async function BrandGuidelinesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
        {locale === "zh" ? "品牌规范" : "Brand guidelines"}
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh"
          ? "上传 Logo、主色、字体与语调，供创作者遵循。"
          : "Upload logo, colors, typography, and tone for creators to follow."}
      </p>
      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-8 text-center text-sm text-zinc-500">
          {locale === "zh" ? "品牌规范编辑器即将上线。" : "Brand guidelines editor coming soon."}
        </CardContent>
      </Card>
    </div>
  );
}
