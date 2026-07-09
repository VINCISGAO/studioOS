import { getAppUiLocale } from "@/lib/app-language";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentClientEmail } from "@/lib/client-session";
import { type SearchParams } from "@/lib/i18n";
import { listOrdersForClient } from "@/lib/order-service";

const assetTypes = [
  { en: "Logo", zh: "Logo" },
  { en: "Fonts", zh: "字体" },
  { en: "Music", zh: "音乐" },
  { en: "Previous ads", zh: "历史广告" },
  { en: "Product images", zh: "产品图" },
  { en: "Brand guide", zh: "品牌手册" }
];

export default async function BrandAssetsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const clientEmail = await getCurrentClientEmail();
  const orders = clientEmail ? await listOrdersForClient(clientEmail) : [];
  const delivered = orders.filter((o) => o.status === "completed").length;

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{locale === "zh" ? "素材库" : "Asset library"}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh"
          ? "品牌全部素材统一存放，AI 制作时自动调用。"
          : "All brand assets in one place — AI pulls them automatically during production."}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {assetTypes.map((type) => (
          <Card key={type.en} className="border-zinc-200/80 shadow-none">
            <CardContent className="p-5">
              <p className="font-medium">{locale === "zh" ? type.zh : type.en}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {locale === "zh" ? "即将接入上传与版本管理" : "Upload & versioning coming next"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {delivered > 0 ? (
        <p className="mt-8 text-sm text-zinc-500">
          {locale === "zh"
            ? `${delivered} 个已交付广告可归档至素材库。`
            : `${delivered} delivered ad(s) ready to archive into the library.`}
        </p>
      ) : null}
    </div>
  );
}
