"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Banknote, Check, Clock3, CreditCard, PencilLine, Sparkles, Users, X } from "lucide-react";
import { LandingSection, LandingShell, MarketingEyebrowPill, MarketingSectionTitle } from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale, MarketingLocale } from "@/lib/i18n";
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
    whyTitle: "Why choose VINCIS?",
    whySubtitle: "With AI and a global creator network, redefine how advertising gets made",
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
    whyTitle: "为什么选择 VINCIS?",
    whySubtitle: "一眼看懂差异，重新定义广告制作流程",
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
    whyTitle: "為什麼選擇 VINCIS?",
    whySubtitle: "用 AI 與全球創作者網路，重新定義廣告製作流程",
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
    whyTitle: "なぜ VINCIS なのか?",
    whySubtitle: "AI とグローバルクリエイターネットワークで、広告制作の進め方を再定義します",
    payment: "支払い",
    traditionalContract: "従来型の契約",
    platformEscrow: "プラットフォーム預託",
    aiAutomation: "AI と自動化",
    none: "なし",
    aiWorkflow: "AIワークフロー",
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
    whyTitle: "왜 VINCIS인가요?",
    whySubtitle: "AI와 글로벌 크리에이터 네트워크로 광고 제작 방식을 재정의합니다",
    payment: "결제",
    traditionalContract: "전통 계약",
    platformEscrow: "플랫폼 에스크로",
    aiAutomation: "AI 및 자동화",
    none: "없음",
    aiWorkflow: "AI 지원",
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
    whyTitle: "Mengapa pilih VINCIS?",
    whySubtitle: "Fahami perbezaannya sekilas pandang — takrif semula produksi iklan",
    payment: "Pembayaran",
    traditionalContract: "Kontrak tradisional",
    platformEscrow: "Escrow platform",
    aiAutomation: "AI & automasi",
    none: "Tiada",
    aiWorkflow: "Aliran AI",
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
    whyTitle: "ហេតុអ្វីជ្រើស VINCIS?",
    whySubtitle: "មើលឃើញភាពខុសគ្នាភ្លាមៗ — កំណត់និយមន័យថ្មីនៃផលិតកម្មពាណិជ្ជកម្ម",
    payment: "ការទូទាត់",
    traditionalContract: "កិច្ចសន្យាបែបចាស់",
    platformEscrow: "ទូទាត់តាម escrow",
    aiAutomation: "AI និងស្វ័យប្រវត្តិកម្ម",
    none: "គ្មាន",
    aiWorkflow: "លំហូរ AI",
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
    whyTitle: "ทำไมต้อง VINCIS?",
    whySubtitle: "เห็นความต่างได้ในพริบตา — นิยามใหม่ของการผลิตโฆษณา",
    payment: "การชำระเงิน",
    traditionalContract: "สัญญาแบบเดิม",
    platformEscrow: "เอสโครว์บนแพลตฟอร์ม",
    aiAutomation: "AI และระบบอัตโนมัติ",
    none: "ไม่มี",
    aiWorkflow: "เวิร์กโฟลว์ AI",
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
    whyTitle: "Vì sao chọn VINCIS?",
    whySubtitle: "Thấy rõ sự khác biệt ngay lập tức — định nghĩa lại sản xuất quảng cáo",
    payment: "Thanh toán",
    traditionalContract: "Hợp đồng truyền thống",
    platformEscrow: "Ký quỹ trên nền tảng",
    aiAutomation: "AI & tự động hóa",
    none: "Không có",
    aiWorkflow: "Quy trình AI",
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
    whyTitle: "Pourquoi choisir VINCIS ?",
    whySubtitle: "Voyez la différence d'un coup d'œil — redéfinissez la production publicitaire",
    payment: "Paiement",
    traditionalContract: "Contrat classique",
    platformEscrow: "Escrow plateforme",
    aiAutomation: "IA et automatisation",
    none: "Aucun",
    aiWorkflow: "Flux IA",
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
    whyTitle: "¿Por qué elegir VINCIS?",
    whySubtitle: "Entiende la diferencia de un vistazo — redefine la producción publicitaria",
    payment: "Pago",
    traditionalContract: "Contrato tradicional",
    platformEscrow: "Escrow de plataforma",
    aiAutomation: "IA y automatización",
    none: "Ninguno",
    aiWorkflow: "Flujo con IA",
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
    <LandingSection className="relative overflow-hidden bg-[#000000] !pt-0 !pb-14 sm:!py-16 lg:!py-20">
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
  traditional,
  studio,
  labels,
  badges,
  costRows,
  workflowRows,
  reduce
}: {
  locale: Locale;
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
        <MarketingSectionTitle as="h3" className="mt-4 text-center sm:mt-5">
          {labels.whyTitle}
        </MarketingSectionTitle>
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
            <div className="grid shrink-0 grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_minmax(0,1.1fr)] border-b border-white/[0.08] text-[12px] font-semibold tracking-[0.08em] text-zinc-400 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.9fr)_minmax(220px,1fr)] sm:text-[13px]">
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
      </motion.div>
    </motion.div>
  );
}

function ComparisonValueCell({
  tone,
  children
}: {
  tone: "legacy" | "studio";
  children: ReactNode;
}) {
  const Mark = tone === "studio" ? StudioMark : LegacyMark;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 border-l px-2 py-3 text-center sm:flex-row sm:gap-2 sm:px-6 sm:py-3.5",
        tone === "studio"
          ? "relative border-[#e8e0d0]/[0.14] bg-white/[0.04] font-semibold text-white"
          : "border-white/[0.08] font-medium text-zinc-400"
      )}
    >
      <Mark className="h-3.5 w-3.5 shrink-0" />
      <span className="max-w-[8.75rem] text-pretty text-[11px] leading-[1.3] sm:max-w-none sm:text-sm sm:leading-normal">
        {children}
      </span>
    </div>
  );
}

function ComparisonTableRow({
  row
}: {
  row: { icon: typeof Banknote; label: string; trad: string; studio: string };
}) {
  const Icon = row.icon;

  return (
    <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_minmax(0,1.1fr)] border-b border-white/[0.07] text-[12px] last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.9fr)_minmax(220px,1fr)] sm:text-sm lg:flex-1">
      <div className="flex flex-col items-center justify-center gap-1 px-3 py-3 text-center font-medium text-zinc-300 sm:flex-row sm:gap-2 sm:px-7 sm:py-3.5">
        <Icon className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.7} />
        <span className="max-w-[8.75rem] text-pretty text-[11px] leading-[1.3] sm:max-w-none sm:text-sm sm:leading-normal">
          {row.label}
        </span>
      </div>
      <ComparisonValueCell tone="legacy">{row.trad}</ComparisonValueCell>
      <ComparisonValueCell tone="studio">{row.studio}</ComparisonValueCell>
    </div>
  );
}
