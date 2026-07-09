"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Banknote, Check, Clock3, CreditCard, PencilLine, Sparkles, Users, X } from "lucide-react";
import { LandingSection, LandingShell, MarketingEyebrowPill } from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function LegacyMark({ className }: { className?: string }) {
  return <X className={cn("h-4 w-4 text-rose-300/80", className)} strokeWidth={2.2} aria-hidden />;
}

function StudioMark({ className }: { className?: string }) {
  return <Check className={cn("h-4 w-4 text-[#e8e0d0]", className)} strokeWidth={2.15} aria-hidden />;
}

type ComparisonLabels = {
  model: string;
  legacy: string;
  studio: string;
  pain: string;
  workflow: string;
  faster: string;
  cheaper: string;
  smarter: string;
  creatorCta: string;
  creatorSub: string;
  cases: string;
  start: string;
  whyTitle: string;
  whySubtitle: string;
  payment: string;
  traditionalContract: string;
  platformEscrow: string;
  aiAutomation: string;
  none: string;
  aiWorkflow: string;
  costSaved: string;
  comparedWithAgencies: string;
  deliveryTime: string;
  fasterDelivery: string;
  globalReach: string;
  countriesRegions: string;
};

const comparisonLabels: Record<MarketingLocale, ComparisonLabels> = {
  en: {
    model: "Comparison model",
    legacy: "Legacy stack",
    studio: "Operating system",
    pain: "Why it feels heavy",
    workflow: "Compare",
    faster: "Faster",
    cheaper: "Cheaper",
    smarter: "Smarter",
    creatorCta: "Connect global creators, ship better creative",
    creatorSub: "100+ brands and creators have collaborated through VINCIS",
    cases: "View cases",
    start: "Start now",
    whyTitle: "Why choose VINCIS?",
    whySubtitle: "Redefine commercial production with AI and a global creator network",
    payment: "Payment",
    traditionalContract: "Traditional contract",
    platformEscrow: "Platform escrow",
    aiAutomation: "AI & automation",
    none: "None",
    aiWorkflow: "AI-assisted workflow",
    costSaved: "Cost saved",
    comparedWithAgencies: "Compared with agencies",
    deliveryTime: "Delivery time",
    fasterDelivery: "Faster project delivery",
    globalReach: "Global reach",
    countriesRegions: "countries and regions"
  },
  "zh-CN": {
    model: "对比模型",
    legacy: "传统链路",
    studio: "系统化交付",
    pain: "传统模式的问题",
    workflow: "对比项",
    faster: "更快",
    cheaper: "更便宜",
    smarter: "更智能",
    creatorCta: "一眼看懂差异",
    creatorSub: "已经有 100+ 品牌和创作者在 VINCIS 完成合作",
    cases: "了解更多案例",
    start: "立即开始",
    whyTitle: "为什么选择 VINCIS?",
    whySubtitle: "用 AI 和全球创作者网络，重新定义广告制作流程",
    payment: "支付方式",
    traditionalContract: "传统合同",
    platformEscrow: "平台托管支付",
    aiAutomation: "AI & 智能",
    none: "无",
    aiWorkflow: "AI 赋能全流程",
    costSaved: "节省成本",
    comparedWithAgencies: "相比传统广告公司",
    deliveryTime: "交付时间",
    fasterDelivery: "更快完成项目",
    globalReach: "覆盖全球",
    countriesRegions: "国家和地区的创作者"
  },
  "zh-TW": {
    model: "對比模型",
    legacy: "傳統流程",
    studio: "系統化交付",
    pain: "傳統模式的問題",
    workflow: "對比項",
    faster: "更快",
    cheaper: "更省",
    smarter: "更智能",
    creatorCta: "一眼看懂差異",
    creatorSub: "已有 100+ 品牌與創作者透過 VINCIS 合作",
    cases: "查看更多案例",
    start: "立即開始",
    whyTitle: "為什麼選擇 VINCIS?",
    whySubtitle: "以 AI 和全球創作者網絡，重新定義廣告製作流程",
    payment: "付款方式",
    traditionalContract: "傳統合約",
    platformEscrow: "平台託管付款",
    aiAutomation: "AI 與自動化",
    none: "無",
    aiWorkflow: "AI 輔助工作流",
    costSaved: "節省成本",
    comparedWithAgencies: "相較傳統廣告公司",
    deliveryTime: "交付時間",
    fasterDelivery: "專案交付更快",
    globalReach: "全球覆蓋",
    countriesRegions: "國家和地區"
  },
  ja: {
    model: "比較モデル",
    legacy: "従来の体制",
    studio: "制作オペレーティングシステム",
    pain: "従来型が重い理由",
    workflow: "比較項目",
    faster: "より速く",
    cheaper: "より低コスト",
    smarter: "よりスマート",
    creatorCta: "世界中のクリエイターとつながり、より良い広告を届ける",
    creatorSub: "100以上のブランドとクリエイターが VINCIS で協業しています",
    cases: "事例を見る",
    start: "今すぐ始める",
    whyTitle: "なぜ VINCIS なのか?",
    whySubtitle: "AI とグローバルなクリエイターネットワークで広告制作を再定義します",
    payment: "支払い",
    traditionalContract: "従来型の契約",
    platformEscrow: "プラットフォーム預託",
    aiAutomation: "AI と自動化",
    none: "なし",
    aiWorkflow: "AI 支援ワークフロー",
    costSaved: "削減コスト",
    comparedWithAgencies: "代理店と比較",
    deliveryTime: "納品時間",
    fasterDelivery: "より速いプロジェクト納品",
    globalReach: "グローバル展開",
    countriesRegions: "か国・地域"
  },
  ko: {
    model: "비교 모델",
    legacy: "기존 방식",
    studio: "제작 운영 시스템",
    pain: "기존 제작이 무거운 이유",
    workflow: "비교 항목",
    faster: "더 빠르게",
    cheaper: "더 낮은 비용",
    smarter: "더 스마트하게",
    creatorCta: "글로벌 크리에이터와 연결해 더 좋은 광고를 만드세요",
    creatorSub: "100개 이상의 브랜드와 크리에이터가 VINCIS에서 협업했습니다",
    cases: "사례 보기",
    start: "지금 시작하기",
    whyTitle: "왜 VINCIS인가요?",
    whySubtitle: "AI와 글로벌 크리에이터 네트워크로 광고 제작 방식을 재정의합니다",
    payment: "결제",
    traditionalContract: "전통 계약",
    platformEscrow: "플랫폼 에스크로",
    aiAutomation: "AI 및 자동화",
    none: "없음",
    aiWorkflow: "AI 지원 워크플로",
    costSaved: "절감 비용",
    comparedWithAgencies: "대행사 대비",
    deliveryTime: "납품 시간",
    fasterDelivery: "더 빠른 프로젝트 납품",
    globalReach: "글로벌 도달",
    countriesRegions: "국가 및 지역"
  },
  ms: {
    model: "Model perbandingan",
    legacy: "Aliran lama",
    studio: "Sistem operasi produksi",
    pain: "Mengapa aliran lama terasa berat",
    workflow: "Bandingan",
    faster: "Lebih pantas",
    cheaper: "Lebih jimat",
    smarter: "Lebih pintar",
    creatorCta: "Hubungkan pencipta global dan hasilkan kreatif yang lebih baik",
    creatorSub: "100+ jenama dan pencipta telah bekerjasama melalui VINCIS",
    cases: "Lihat kes",
    start: "Mula sekarang",
    whyTitle: "Mengapa pilih VINCIS?",
    whySubtitle: "Takrif semula produksi iklan dengan AI dan rangkaian pencipta global",
    payment: "Pembayaran",
    traditionalContract: "Kontrak tradisional",
    platformEscrow: "Escrow platform",
    aiAutomation: "AI & automasi",
    none: "Tiada",
    aiWorkflow: "Aliran kerja dibantu AI",
    costSaved: "Kos dijimatkan",
    comparedWithAgencies: "Berbanding agensi",
    deliveryTime: "Masa penghantaran",
    fasterDelivery: "Penghantaran projek lebih pantas",
    globalReach: "Capaian global",
    countriesRegions: "negara dan rantau"
  },
  km: {
    model: "គំរូប្រៀបធៀប",
    legacy: "ប្រព័ន្ធចាស់",
    studio: "ប្រព័ន្ធដំណើរការផលិតកម្ម",
    pain: "មូលហេតុដែលវិធីចាស់យឺត និងធ្ងន់",
    workflow: "ប្រៀបធៀប",
    faster: "លឿនជាង",
    cheaper: "ចំណាយតិចជាង",
    smarter: "ឆ្លាតជាង",
    creatorCta: "ភ្ជាប់អ្នកបង្កើតសកល និងបញ្ចេញគំនិតផ្សព្វផ្សាយល្អជាង",
    creatorSub: "ម៉ាក និងអ្នកបង្កើត 100+ បានសហការតាម VINCIS",
    cases: "មើលករណីសិក្សា",
    start: "ចាប់ផ្តើមឥឡូវ",
    whyTitle: "ហេតុអ្វីជ្រើស VINCIS?",
    whySubtitle: "កំណត់និយមន័យថ្មីនៃផលិតកម្មពាណិជ្ជកម្មជាមួយ AI និងបណ្តាញអ្នកបង្កើតសកល",
    payment: "ការទូទាត់",
    traditionalContract: "កិច្ចសន្យាបែបចាស់",
    platformEscrow: "ទូទាត់តាម escrow",
    aiAutomation: "AI និងស្វ័យប្រវត្តិកម្ម",
    none: "គ្មាន",
    aiWorkflow: "លំហូរការងារជំនួយដោយ AI",
    costSaved: "ចំណាយដែលសន្សំបាន",
    comparedWithAgencies: "ប្រៀបធៀបនឹងភ្នាក់ងារ",
    deliveryTime: "ពេលវេលាប្រគល់",
    fasterDelivery: "ប្រគល់គម្រោងបានលឿនជាង",
    globalReach: "គ្របដណ្តប់សកល",
    countriesRegions: "ប្រទេស និងតំបន់"
  },
  th: {
    model: "โมเดลเปรียบเทียบ",
    legacy: "กระบวนการเดิม",
    studio: "ระบบปฏิบัติการงานผลิต",
    pain: "เหตุผลที่วิธีเดิมหนักและช้า",
    workflow: "เปรียบเทียบ",
    faster: "เร็วกว่า",
    cheaper: "คุ้มค่ากว่า",
    smarter: "ฉลาดกว่า",
    creatorCta: "เชื่อมต่อครีเอเตอร์ทั่วโลกและส่งมอบงานที่ดีกว่า",
    creatorSub: "แบรนด์และครีเอเตอร์กว่า 100 รายร่วมงานผ่าน VINCIS แล้ว",
    cases: "ดูเคส",
    start: "เริ่มตอนนี้",
    whyTitle: "ทำไมต้อง VINCIS?",
    whySubtitle: "นิยามใหม่ของการผลิตโฆษณาด้วย AI และเครือข่ายครีเอเตอร์ทั่วโลก",
    payment: "การชำระเงิน",
    traditionalContract: "สัญญาแบบเดิม",
    platformEscrow: "เอสโครว์บนแพลตฟอร์ม",
    aiAutomation: "AI และระบบอัตโนมัติ",
    none: "ไม่มี",
    aiWorkflow: "เวิร์กโฟลว์ที่ช่วยด้วย AI",
    costSaved: "ประหยัดต้นทุน",
    comparedWithAgencies: "เทียบกับเอเจนซี่",
    deliveryTime: "เวลาในการส่งมอบ",
    fasterDelivery: "ส่งมอบโปรเจกต์เร็วขึ้น",
    globalReach: "ครอบคลุมทั่วโลก",
    countriesRegions: "ประเทศและภูมิภาค"
  },
  vi: {
    model: "Mô hình so sánh",
    legacy: "Quy trình cũ",
    studio: "Hệ điều hành sản xuất",
    pain: "Vì sao cách làm cũ quá nặng",
    workflow: "So sánh",
    faster: "Nhanh hơn",
    cheaper: "Tiết kiệm hơn",
    smarter: "Thông minh hơn",
    creatorCta: "Kết nối nhà sáng tạo toàn cầu, tạo quảng cáo tốt hơn",
    creatorSub: "Hơn 100 thương hiệu và nhà sáng tạo đã hợp tác qua VINCIS",
    cases: "Xem case study",
    start: "Bắt đầu ngay",
    whyTitle: "Vì sao chọn VINCIS?",
    whySubtitle: "Định nghĩa lại sản xuất quảng cáo bằng AI và mạng lưới nhà sáng tạo toàn cầu",
    payment: "Thanh toán",
    traditionalContract: "Hợp đồng truyền thống",
    platformEscrow: "Ký quỹ trên nền tảng",
    aiAutomation: "AI & tự động hóa",
    none: "Không có",
    aiWorkflow: "Quy trình được AI hỗ trợ",
    costSaved: "Chi phí tiết kiệm",
    comparedWithAgencies: "So với agency",
    deliveryTime: "Thời gian giao",
    fasterDelivery: "Giao dự án nhanh hơn",
    globalReach: "Phủ sóng toàn cầu",
    countriesRegions: "quốc gia và khu vực"
  },
  fr: {
    model: "Modèle comparatif",
    legacy: "Chaîne classique",
    studio: "Système de production",
    pain: "Pourquoi l'ancien modèle est lourd",
    workflow: "Comparer",
    faster: "Plus rapide",
    cheaper: "Moins cher",
    smarter: "Plus intelligent",
    creatorCta: "Connectez des créateurs mondiaux et livrez de meilleures créations",
    creatorSub: "Plus de 100 marques et créateurs ont collaboré via VINCIS",
    cases: "Voir les cas",
    start: "Commencer",
    whyTitle: "Pourquoi choisir VINCIS ?",
    whySubtitle: "Redéfinir la production publicitaire avec l'IA et un réseau mondial de créateurs",
    payment: "Paiement",
    traditionalContract: "Contrat classique",
    platformEscrow: "Escrow plateforme",
    aiAutomation: "IA et automatisation",
    none: "Aucun",
    aiWorkflow: "Flux assisté par IA",
    costSaved: "Coûts économisés",
    comparedWithAgencies: "Par rapport aux agences",
    deliveryTime: "Délai de livraison",
    fasterDelivery: "Livraison de projet plus rapide",
    globalReach: "Portée mondiale",
    countriesRegions: "pays et régions"
  },
  es: {
    model: "Modelo comparativo",
    legacy: "Flujo tradicional",
    studio: "Sistema operativo de producción",
    pain: "Por qué el modelo antiguo pesa tanto",
    workflow: "Comparar",
    faster: "Más rápido",
    cheaper: "Más económico",
    smarter: "Más inteligente",
    creatorCta: "Conecta creadores globales y entrega mejores piezas",
    creatorSub: "Más de 100 marcas y creadores han colaborado en VINCIS",
    cases: "Ver casos",
    start: "Empezar ahora",
    whyTitle: "¿Por qué elegir VINCIS?",
    whySubtitle: "Redefine la producción publicitaria con IA y una red global de creadores",
    payment: "Pago",
    traditionalContract: "Contrato tradicional",
    platformEscrow: "Escrow de plataforma",
    aiAutomation: "IA y automatización",
    none: "Ninguno",
    aiWorkflow: "Flujo asistido por IA",
    costSaved: "Ahorro de costes",
    comparedWithAgencies: "Comparado con agencias",
    deliveryTime: "Tiempo de entrega",
    fasterDelivery: "Entrega de proyecto más rápida",
    globalReach: "Alcance global",
    countriesRegions: "países y regiones"
  }
};

export function LandingCostComparison({
  locale,
  copyLocale = locale
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
}) {
  const t = landingText("cost", copyLocale);
  const reduce = useReducedMotion();
  const costRows = t.rows.slice(0, 2);
  const workflowRows = t.rows.slice(2);
  const comparisonLocale: MarketingLocale = copyLocale === "zh" ? "zh-CN" : copyLocale;
  const labels = comparisonLabels[comparisonLocale] ?? (locale === "zh" ? comparisonLabels["zh-CN"] : comparisonLabels.en);

  return (
    <LandingSection className="relative overflow-hidden bg-[#000000] !pb-0 !pt-0 sm:!py-16 lg:!py-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(255,255,255,0.07),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        aria-hidden
      />

      <LandingShell className="relative pt-8 sm:pt-0">
        <ComparisonBoard
          locale={locale}
          copyLocale={copyLocale}
          title={t.compareTitle}
          traditional={t.traditional}
          studio={t.studio}
          labels={labels}
          badges={t.savings}
          painPoints={t.pains}
          costRows={costRows}
          workflowRows={workflowRows}
          reduce={reduce}
        />
      </LandingShell>
    </LandingSection>
  );
}

function ComparisonBoard({
  locale,
  copyLocale,
  traditional,
  studio,
  labels,
  badges,
  costRows,
  workflowRows,
  reduce
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  title: string;
  traditional: string;
  studio: string;
  labels: ComparisonLabels;
  badges: readonly string[];
  painPoints: readonly string[];
  costRows: Array<{ label: string; trad: string; studio: string }>;
  workflowRows: Array<{ label: string; trad: string; studio: string }>;
  reduce: boolean | null;
}) {
  const comparisonRows = [
    { icon: Banknote, label: costRows[0]?.label ?? "", trad: costRows[0]?.trad ?? "", studio: costRows[0]?.studio ?? "" },
    { icon: Clock3, label: costRows[1]?.label ?? "", trad: costRows[1]?.trad ?? "", studio: costRows[1]?.studio ?? "" },
    { icon: Users, label: workflowRows[0]?.label ?? "", trad: workflowRows[0]?.trad ?? "", studio: workflowRows[0]?.studio ?? "" },
    { icon: PencilLine, label: workflowRows[1]?.label ?? "", trad: workflowRows[1]?.trad ?? "", studio: workflowRows[1]?.studio ?? "" },
    {
      icon: CreditCard,
      label: labels.payment,
      trad: labels.traditionalContract,
      studio: labels.platformEscrow
    },
    {
      icon: Sparkles,
      label: labels.aiAutomation,
      trad: labels.none,
      studio: labels.aiWorkflow
    }
  ];

  const stats = [
    {
      icon: Banknote,
      label: labels.costSaved,
      value: "70%+",
      caption: labels.comparedWithAgencies
    },
    {
      icon: Clock3,
      label: labels.deliveryTime,
      value: "80%+",
      caption: labels.fasterDelivery
    }
  ];

  return (
    <motion.div
      className="relative mx-auto mt-0 max-w-6xl"
    >
      <div className="pointer-events-none absolute inset-x-8 top-8 h-52 rounded-full bg-[#e8e0d0]/[0.055] blur-3xl" />
      <div className="relative">
        <div className="mx-auto flex max-w-3xl justify-center">
          <MarketingEyebrowPill tone="dark">
            {labels.faster} · {labels.cheaper} · {labels.smarter}
          </MarketingEyebrowPill>
        </div>
        <h3 className="mt-4 text-center text-[2rem] font-semibold tracking-[-0.055em] text-white sm:mt-5 sm:text-[2.9rem]">
          {labels.whyTitle}
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-zinc-500 sm:mt-3 sm:text-base">
          {labels.whySubtitle}
        </p>
      </div>

      <motion.div
        whileHover={
          reduce
            ? undefined
            : {
                y: -3,
                transition: { type: "spring", stiffness: 360, damping: 30 }
              }
        }
        className="relative mt-7 overflow-hidden rounded-[1.65rem] border border-white/[0.12] bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] backdrop-blur-2xl"
      >
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-[radial-gradient(ellipse_at_center,rgba(232,224,208,0.13),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#e8e0d0]/45 to-transparent" />

        <div className="relative grid items-stretch lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 lg:flex lg:h-full lg:flex-col">
            <div className="grid shrink-0 grid-cols-[minmax(0,0.9fr)_minmax(92px,0.75fr)_minmax(112px,0.9fr)] border-b border-white/[0.08] text-[12px] font-semibold tracking-[0.08em] text-zinc-400 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.9fr)_minmax(220px,1fr)] sm:text-[13px]">
              <div className="px-4 py-4 text-center sm:px-7">{labels.workflow}</div>
              <div className="border-l border-white/[0.08] px-3 py-4 text-center sm:px-6">{traditional}</div>
              <div className="relative border-l border-[#e8e0d0]/[0.14] bg-white/[0.04] px-3 py-4 text-center text-white sm:px-6">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#e8e0d0] shadow-[0_0_18px_rgba(232,224,208,0.7)]" />
                  VINCIS
                </span>
              </div>
            </div>

        {comparisonRows.map((row) => (
          <ComparisonTableRow key={row.label} row={row} />
            ))}
          </div>

          <div className="grid h-full grid-cols-2 gap-3 border-t border-white/[0.08] p-4 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:p-5">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex h-full items-center gap-4 rounded-2xl border border-white/[0.075] bg-white/[0.04] px-5 py-3.5"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/[0.065] text-[#e8e0d0] ring-1 ring-white/[0.06]">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span>
                    <span className="block text-[12px] font-medium text-zinc-400">{stat.label}</span>
                    <span className="block text-2xl font-semibold tracking-[-0.05em] text-[#e8e0d0]">{stat.value}</span>
                    <span className="block text-[11px] text-zinc-500">{stat.caption}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative grid gap-4 border-t border-white/[0.08] px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7">
          <div className="text-center">
            <p className="text-base font-semibold tracking-[-0.035em] text-white">{labels.creatorCta}</p>
            <p className="mt-1 text-sm text-zinc-500">{labels.creatorSub}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#work"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.12] px-5 text-sm font-medium text-zinc-200 transition hover:border-white/25 hover:bg-white/[0.05]"
            >
              {labels.cases}
              <span aria-hidden>→</span>
            </a>
            <a
              href={withLocale("/login?role=brand", copyLocale ?? locale)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              {labels.start}
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ComparisonTableRow({
  row
}: {
  row: { icon: typeof Banknote; label: string; trad: string; studio: string };
}) {
  const Icon = row.icon;

  return (
    <div
      className="grid grid-cols-[minmax(0,0.9fr)_minmax(92px,0.75fr)_minmax(112px,0.9fr)] border-b border-white/[0.07] text-[12px] last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.9fr)_minmax(220px,1fr)] sm:text-sm lg:flex-1"
    >
      <div className="flex items-center justify-center gap-2 px-4 py-3.5 text-center font-medium text-zinc-300 sm:px-7">
        <Icon className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.7} />
        <span>{row.label}</span>
      </div>
      <div className="flex items-center justify-center gap-2 border-l border-white/[0.08] px-3 py-3.5 font-medium text-zinc-400 sm:px-6">
        <LegacyMark className="hidden h-3.5 w-3.5 sm:block" />
        <span>{row.trad}</span>
      </div>
      <div className="relative flex items-center justify-center gap-2 border-l border-[#e8e0d0]/[0.14] bg-white/[0.04] px-3 py-3.5 font-semibold text-white sm:px-6">
        <StudioMark className="h-3.5 w-3.5" />
        <span>{row.studio}</span>
      </div>
    </div>
  );
}
