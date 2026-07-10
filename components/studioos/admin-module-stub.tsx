import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n";
import { getLocale, type SearchParams } from "@/lib/i18n";

type StubCopy = {
  title: Record<Locale, string>;
  subtitle: Record<Locale, string>;
  bullets: Record<Locale, string[]>;
};

const stubs: Record<string, StubCopy> = {
  settings: {
    title: { en: "Settings", zh: "系统设置" },
    subtitle: { en: "Platform configuration and admin preferences.", zh: "平台配置与管理员偏好。" },
    bullets: {
      en: ["Role & permission templates", "Email & notification defaults", "Regional & locale settings"],
      zh: ["角色与权限模板", "邮件与通知默认值", "区域与语言设置"]
    }
  },
  system: {
    title: { en: "System", zh: "系统" },
    subtitle: { en: "Infrastructure health and maintenance tools.", zh: "基础设施健康与维护工具。" },
    bullets: {
      en: ["Background job queue", "Cache & storage status", "Maintenance windows"],
      zh: ["后台任务队列", "缓存与存储状态", "维护窗口"]
    }
  },
  finance: {
    title: { en: "Finance", zh: "财务" },
    subtitle: { en: "Revenue reporting and reconciliation.", zh: "收入报表与对账。" },
    bullets: {
      en: ["Monthly revenue rollups", "Fee breakdown by campaign", "Tax & invoice exports"],
      zh: ["月度收入汇总", "按活动手续费明细", "税务与发票导出"]
    }
  },
  monitoring: {
    title: { en: "Monitoring", zh: "监控" },
    subtitle: { en: "Live platform observability.", zh: "平台实时可观测性。" },
    bullets: {
      en: ["API latency & error rates", "Payment webhook health", "Review pipeline throughput"],
      zh: ["API 延迟与错误率", "支付 Webhook 健康", "审片流水线吞吐"]
    }
  },
  certification: {
    title: { en: "Certification", zh: "认证" },
    subtitle: { en: "Creator certification and partner badges.", zh: "创作者认证与合作伙伴徽章。" },
    bullets: {
      en: ["Certification queue", "Badge tier management", "Partner verification"],
      zh: ["认证审核队列", "徽章等级管理", "合作伙伴验证"]
    }
  },
  partners: {
    title: { en: "Partners", zh: "合作伙伴" },
    subtitle: { en: "Partner network and co-marketing programs.", zh: "合作伙伴网络与联合营销。" },
    bullets: {
      en: ["Partner roster", "Referral tracking", "Co-branded campaigns"],
      zh: ["合作伙伴名录", "推荐追踪", "联合品牌活动"]
    }
  },
  academy: {
    title: { en: "Academy", zh: "学院" },
    subtitle: { en: "Training content for brands and creators.", zh: "面向品牌方与创作者的培训内容。" },
    bullets: {
      en: ["Course library", "Onboarding paths", "Certification prep"],
      zh: ["课程库", "入驻路径", "认证备考"]
    }
  }
};

export function createAdminStubPage(slug: keyof typeof stubs) {
  const copy = stubs[slug];

  return async function AdminStubPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const locale = getLocale(await searchParams);
    const t = {
      title: copy.title[locale],
      subtitle: copy.subtitle[locale],
      bullets: copy.bullets[locale],
      comingSoon: locale === "zh" ? "即将推出" : "Coming soon"
    };

    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
        <Card className="mt-8 border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-zinc-900">{t.comingSoon}</p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-600">
              {t.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  };
}
