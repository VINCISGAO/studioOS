import Image from "next/image";
import Link from "next/link";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { isChineseLanguage, withLocale } from "@/lib/i18n";
import { studioOS } from "@/lib/studioos/vocabulary";
import { cn } from "@/lib/utils";
import { ArrowRight, BookOpen, Box, Globe2, Shield, Sparkles, Users, Zap, type LucideIcon } from "lucide-react";

const links: Record<MarketingLocale, {
  product: string;
  studios: string;
  pricing: string;
  brand: string;
  studio: string;
  portals: string;
  howItWorks: string;
  rights: string;
  tagline: string;
}> = {
  en: {
    product: "Product",
    studios: "Studios",
    pricing: "Pricing",
    brand: "Brand portal",
    studio: "Studio portal",
    portals: "Portals",
    howItWorks: "How it works",
    rights: "All rights reserved.",
    tagline: studioOS.tagline.en
  },
  "zh-CN": {
    product: "产品",
    studios: "Studio 作品库",
    pricing: "价格",
    brand: "Brand 门户",
    studio: "创作者",
    portals: "入口",
    howItWorks: "如何运作",
    rights: "保留所有权利。",
    tagline: studioOS.tagline.zh
  },
  "zh-TW": {
    product: "產品",
    studios: "Studio 作品庫",
    pricing: "價格",
    brand: "品牌入口",
    studio: "創作者入口",
    portals: "入口",
    howItWorks: "如何運作",
    rights: "保留所有權利。",
    tagline: "連接全球品牌與 AI 驅動創意製作的基礎設施。"
  },
  ja: {
    product: "プロダクト",
    studios: "スタジオ",
    pricing: "料金",
    brand: "ブランドポータル",
    studio: "スタジオポータル",
    portals: "ポータル",
    howItWorks: "仕組み",
    rights: "無断転載を禁じます。",
    tagline: "グローバルブランドと AI 活用型クリエイティブ制作をつなぐインフラ。"
  },
  ko: {
    product: "제품",
    studios: "스튜디오",
    pricing: "가격",
    brand: "브랜드 포털",
    studio: "스튜디오 포털",
    portals: "포털",
    howItWorks: "작동 방식",
    rights: "모든 권리 보유.",
    tagline: "글로벌 브랜드와 AI 기반 크리에이티브 제작을 연결하는 인프라."
  },
  ms: {
    product: "Produk",
    studios: "Studio",
    pricing: "Harga",
    brand: "Portal jenama",
    studio: "Portal studio",
    portals: "Portal",
    howItWorks: "Cara ia berfungsi",
    rights: "Hak cipta terpelihara.",
    tagline: "Infrastruktur yang menghubungkan jenama global dengan produksi kreatif berkuasa AI."
  },
  km: {
    product: "ផលិតផល",
    studios: "ស្ទូឌីយោ",
    pricing: "តម្លៃ",
    brand: "ផតថលម៉ាក",
    studio: "ផតថលស្ទូឌីយោ",
    portals: "ផតថល",
    howItWorks: "របៀបដំណើរការ",
    rights: "រក្សាសិទ្ធិគ្រប់យ៉ាង។",
    tagline: "ហេដ្ឋារចនាសម្ព័ន្ធដែលភ្ជាប់ម៉ាកសកលជាមួយផលិតកម្មច្នៃប្រឌិតដោយ AI។"
  },
  th: {
    product: "ผลิตภัณฑ์",
    studios: "สตูดิโอ",
    pricing: "ราคา",
    brand: "พอร์ทัลแบรนด์",
    studio: "พอร์ทัลสตูดิโอ",
    portals: "พอร์ทัล",
    howItWorks: "วิธีการทำงาน",
    rights: "สงวนลิขสิทธิ์.",
    tagline: "โครงสร้างพื้นฐานที่เชื่อมแบรนด์ทั่วโลกกับการผลิตครีเอทีฟที่ขับเคลื่อนด้วย AI"
  },
  vi: {
    product: "Sản phẩm",
    studios: "Studio",
    pricing: "Giá",
    brand: "Cổng thương hiệu",
    studio: "Cổng studio",
    portals: "Cổng truy cập",
    howItWorks: "Cách hoạt động",
    rights: "Đã đăng ký bản quyền.",
    tagline: "Hạ tầng kết nối thương hiệu toàn cầu với sản xuất sáng tạo được hỗ trợ bởi AI."
  },
  fr: {
    product: "Produit",
    studios: "Studios",
    pricing: "Tarifs",
    brand: "Portail marque",
    studio: "Portail studio",
    portals: "Portails",
    howItWorks: "Fonctionnement",
    rights: "Tous droits réservés.",
    tagline: "L'infrastructure qui relie les marques mondiales à la production créative propulsée par l'IA."
  },
  es: {
    product: "Producto",
    studios: "Estudios",
    pricing: "Precios",
    brand: "Portal de marca",
    studio: "Portal de estudio",
    portals: "Portales",
    howItWorks: "Cómo funciona",
    rights: "Todos los derechos reservados.",
    tagline: "Infraestructura que conecta marcas globales con producción creativa impulsada por IA."
  }
};

const footerStory: Record<MarketingLocale, { lead: string; highlight: string }> = {
  en: { lead: "Every great story begins with a ", highlight: "connection." },
  "zh-CN": { lead: "每个伟大故事    都始于一次", highlight: "连接" },
  "zh-TW": { lead: "每個偉大故事    都始於一次", highlight: "連接" },
  ja: { lead: "すべての素晴らしい物語は", highlight: "つながりから始まる。" },
  ko: { lead: "모든 위대한 이야기는 ", highlight: "연결에서 시작됩니다." },
  ms: { lead: "Setiap kisah hebat bermula dengan ", highlight: "hubungan." },
  km: { lead: "រឿងដ៏អស្ចារ្យគ្រប់រឿងចាប់ផ្តើមពី", highlight: "ការតភ្ជាប់។" },
  th: { lead: "เรื่องราวที่ยอดเยี่ยมเริ่มต้นจาก", highlight: "การเชื่อมต่อ" },
  vi: { lead: "Mọi câu chuyện lớn bắt đầu từ ", highlight: "một kết nối." },
  fr: { lead: "Chaque grande histoire commence par une ", highlight: "connexion." },
  es: { lead: "Toda gran historia empieza con una ", highlight: "conexión." }
};

const footerSocialIcons = [
  { label: "X", src: "/images/social-sources/x.svg" },
  { label: "YouTube", src: "/images/social-sources/youtube.svg" },
  { label: "Instagram", src: "/images/social-sources/instagram.svg" }
] as const;

type FooterNavGroup = {
  title: string;
  icon: LucideIcon;
  items: { label: string; href: string }[];
};

function FooterNavSections({
  locale,
  groups,
  className
}: {
  locale: Locale | MarketingLocale;
  groups: FooterNavGroup[];
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-zinc-200 border-y border-zinc-200", className)}>
      {groups.map((group) => {
        const Icon = group.icon;
        return (
          <section key={group.title} className="py-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm leading-6">
              <span className="inline-flex shrink-0 items-center gap-4">
                <Icon className="h-5 w-5 text-indigo-600" strokeWidth={1.8} />
                <span className="text-lg font-semibold tracking-[-0.03em] text-zinc-950">{group.title}</span>
              </span>
              <span className="text-zinc-300">|</span>
              {group.items.map((item, index) => (
                <span key={item.label} className="inline-flex items-center gap-3">
                  <Link href={withLocale(item.href, locale)} className="text-zinc-500 transition hover:text-zinc-950">
                    {item.label}
                  </Link>
                  {index < group.items.length - 1 ? <span className="text-zinc-300">|</span> : null}
                </span>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function FooterBottomBar({
  locale,
  rights,
  className
}: {
  locale: Locale | MarketingLocale;
  rights: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex shrink-0 items-center gap-3">
        {footerSocialIcons.map((item) => (
          <a
            key={item.label}
            href="#"
            aria-label={item.label}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm transition hover:opacity-80"
          >
            <Image src={item.src} alt="" width={24} height={24} className="h-6 w-6" />
          </a>
        ))}
        <LanguageSwitcher locale={locale} tone="light" variant="icon" menuPlacement="top" />
      </div>
      <p className="whitespace-nowrap text-sm leading-6 text-zinc-500">
        © {new Date().getFullYear()} {studioOS.productName} {rights}
      </p>
    </div>
  );
}

export function MarketingFooter({
  locale,
  tone = "light"
}: {
  locale: Locale | MarketingLocale;
  tone?: "light" | "dark";
}) {
  const t = links[locale as MarketingLocale] ?? (isChineseLanguage(locale) ? links["zh-CN"] : links.en);
  const isZh = isChineseLanguage(locale);
  const footerLocale: MarketingLocale = locale === "zh" ? "zh-CN" : (locale as MarketingLocale);
  const story = footerStory[footerLocale] ?? (isChineseLanguage(locale) ? footerStory["zh-CN"] : footerStory.en);
  void tone;
  const navGroups = [
    {
      title: isZh ? "产品" : "Product",
      icon: Box,
      items: [
        { label: isZh ? "品牌如何运作" : "How brands work", href: "/how-it-works" },
        { label: isZh ? "AI 匹配" : "AI matching", href: "/#how-it-works" },
        { label: isZh ? "审片与交付" : "Review & delivery", href: "/#escrow" },
        { label: isZh ? "定价方案" : "Pricing", href: "/pricing" }
      ]
    },
    {
      title: isZh ? "创作者" : "Creators",
      icon: Users,
      items: [
        { label: isZh ? "Studio 作品库" : "Studio portfolio", href: "/creators" },
        { label: isZh ? "成为创作者" : "Become a creator", href: "/login?role=creator" },
        { label: isZh ? "交付标准" : "Delivery standards", href: "/#escrow" },
        { label: isZh ? "创作者指南" : "Creator guide", href: "/creators" }
      ]
    },
    {
      title: isZh ? "资源" : "Resources",
      icon: BookOpen,
      items: [
        { label: isZh ? "案例研究" : "Case studies", href: "/case-studies" },
        { label: isZh ? "帮助中心" : "Help center", href: "/contact" },
        { label: isZh ? "学习中心" : "Learning center", href: "/how-it-works" },
        { label: isZh ? "安全与托管" : "Security & escrow", href: "/#escrow" }
      ]
    }
  ];

  const featureBadges = [
    {
      label: isZh ? "全球连接" : "Global reach",
      description: isZh ? "汇聚世界品牌与创作者" : "Connecting global brands and creators",
      icon: Globe2
    },
    {
      label: isZh ? "AI 驱动" : "AI powered",
      description: isZh ? "智能匹配，高效协作" : "Smart matching, efficient collaboration",
      icon: Sparkles
    },
    {
      label: isZh ? "安全托管" : "Secure escrow",
      description: isZh ? "资金安全，数据保障" : "Fund security and data protection",
      icon: Shield
    },
    {
      label: isZh ? "高效交付" : "Fast delivery",
      description: isZh ? "流程透明，极速完成" : "Transparent process, rapid completion",
      icon: Zap
    }
  ];

  return (
    <footer className="bg-[#fbfaf7]">
      <div className="px-7 pb-8 pt-6 text-zinc-950 md:hidden">
        <div className="flex items-center justify-center">
          <Link href={withLocale("/", locale)} className="inline-flex transition hover:opacity-80">
            <BrandLogoLockup
              contrastOn="light"
              markClassName="h-6 w-6 rounded-lg"
              wordmarkClassName="h-[14px] w-[92px]"
            />
          </Link>
        </div>

        <div className="mt-4 text-center">
          <p className="mx-auto max-w-full whitespace-nowrap text-center text-[clamp(0.72rem,3.2vw,1rem)] font-semibold leading-snug tracking-[-0.02em]">
            {story.lead}<span className="text-indigo-600">{story.highlight}</span>
          </p>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2">
          {featureBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.label} className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-3 text-center shadow-sm">
                <Icon className="h-6 w-6 text-indigo-600" strokeWidth={1.8} />
                <span className="text-[11px] font-medium leading-snug text-zinc-700">{badge.label}</span>
              </div>
            );
          })}
        </div>

        <FooterNavSections locale={locale} groups={navGroups} className="mt-6" />

        <div className="relative mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-200/55 blur-xl" />
          <div className="relative flex items-center justify-between gap-4 text-left">
            <div className="flex min-w-0 items-start gap-3">
              <Sparkles className="mt-1 h-6 w-6 shrink-0 text-indigo-600" strokeWidth={1.8} />
              <div className="min-w-0">
                <p className="text-base font-semibold leading-snug text-zinc-950">
                  {isZh ? "准备好开始你的下一次创作了吗？" : "Ready to start your next creative project?"}
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  {isZh ? "加入全球品牌与创作者的连接网络" : "Join the network connecting global brands and creators"}
                </p>
              </div>
            </div>
            <Link
              href={withLocale("/login?role=brand", locale)}
              className="shrink-0 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
            >
              {isZh ? "立即开始" : "Start"}
            </Link>
          </div>
        </div>

        <FooterBottomBar locale={locale} rights={t.rights} className="mt-8" />
      </div>

      <div className="mx-auto hidden max-w-[1240px] px-6 py-10 text-zinc-950 md:block sm:px-10 lg:px-14 lg:py-12">
        <div className="flex items-center justify-between gap-8">
          <Link href={withLocale("/", locale)} className="inline-flex shrink-0 transition hover:opacity-80">
            <BrandLogoLockup
              contrastOn="light"
              markClassName="h-10 w-10 rounded-[14px]"
              wordmarkClassName="h-[22px] w-[138px]"
            />
          </Link>
          <p className="max-w-none whitespace-nowrap text-right text-[clamp(0.85rem,1.2vw,1.25rem)] font-medium leading-snug tracking-[-0.02em]">
            {story.lead}<span className="text-indigo-600">{story.highlight}</span>
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
          <FooterNavSections locale={locale} groups={navGroups} />

          <div className="grid grid-cols-2 gap-3">
            {featureBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.label}
                  className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <Icon className="h-7 w-7 shrink-0 text-indigo-600" strokeWidth={1.8} />
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug text-zinc-950">{badge.label}</p>
                    <p className="mt-0.5 text-sm leading-5 text-zinc-500">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-[1.35rem] border border-indigo-100 bg-white p-6 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-200/55 blur-2xl" />
          <div className="relative flex items-start gap-5">
            <Sparkles className="mt-1 h-8 w-8 shrink-0 text-indigo-600" strokeWidth={1.8} />
            <div>
              <p className="text-xl font-semibold leading-snug text-zinc-950">
                {isZh ? "准备好开始你的下一次创作了吗？" : "Ready to start your next creative project?"}
              </p>
              <p className="mt-2 max-w-xl text-base leading-7 text-zinc-500">
                {isZh ? "加入全球品牌与创作者的连接网络" : "Join the network connecting global brands and creators"}
              </p>
            </div>
          </div>
          <Link
            href={withLocale("/login?role=brand", locale)}
            className="relative mt-5 inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-9 py-3 text-center text-lg font-medium leading-snug text-white shadow-sm transition hover:bg-zinc-800 sm:mt-0"
          >
            {isZh ? "立即开始" : "Start"}
            <ArrowRight className="h-5 w-5" strokeWidth={2} />
          </Link>
        </div>

        <div className="mt-10 border-t border-zinc-200 pt-7">
          <FooterBottomBar locale={locale} rights={t.rights} />
        </div>
      </div>
    </footer>
  );
}
