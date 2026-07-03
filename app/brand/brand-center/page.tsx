import { Building2, Palette, UserRound, Users } from "lucide-react";
import { BrandSectionHub } from "@/components/studioos/brand-section-hub";
import { getLocale, type SearchParams } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

export default async function BrandCenterPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);

  return (
    <BrandSectionHub
      locale={locale}
      title={locale === "zh" ? "品牌中心" : "Brand center"}
      description={
        locale === "zh"
          ? "品牌资料、Logo、介绍、规范与团队成员。"
          : "Brand profile, logo, story, guidelines, and team members."
      }
      sections={[
        {
          href: brandPortalRoutes.brandProfile,
          title: locale === "zh" ? "品牌资料" : "Brand profile",
          description:
            locale === "zh" ? "公司名称、公开主页与品牌 Logo。" : "Company name, public page, and brand logo.",
          icon: Building2
        },
        {
          href: brandPortalRoutes.brandGuidelines,
          title: locale === "zh" ? "品牌规范" : "Brand guidelines",
          description:
            locale === "zh" ? "色彩、字体、语调与素材规范。" : "Colors, typography, tone, and asset rules.",
          icon: Palette
        },
        {
          href: brandPortalRoutes.brandTeam,
          title: locale === "zh" ? "团队成员" : "Team members",
          description:
            locale === "zh" ? "邀请同事查看广告、审片与账单。" : "Invite teammates to manage ads, review, and billing.",
          icon: Users,
          disabled: true
        },
        {
          href: brandPortalRoutes.profile,
          title: locale === "zh" ? "品牌介绍" : "Brand story",
          description:
            locale === "zh" ? "完善对外展示的品牌介绍与案例。" : "Public brand story and showcase cases.",
          icon: UserRound
        }
      ]}
    />
  );
}
