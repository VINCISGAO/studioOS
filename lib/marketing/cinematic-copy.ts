import type { Locale, MarketingLocale } from "@/lib/i18n";
import { isChineseLanguage } from "@/lib/i18n";

export const cinematicCopy = {
  nav: {
    en: {
      cases: "Work",
      process: "Process",
      pricing: "Pricing",
      resources: "Resources",
      about: "About",
      login: "Log in",
      start: "Start project"
    },
    zh: {
      cases: "案例",
      process: "流程",
      pricing: "价格",
      resources: "资源",
      about: "关于我们",
      login: "登录",
      start: "开始项目"
    }
  },
  hero: {
    en: {
      chapter: "01 — Opening",
      lines: ["Connecting global brands", "with AI creators"],
      subtitle:
        "VINCIS gives global brands one place to brief, match AI creators, review cuts, protect payment, and ship campaign-ready assets.",
      primary: "I'm a brand",
      secondary: "I'm a creator",
      loggedInPrimary: "Brand portal",
      scroll: "Scroll to enter"
    },
    zh: {
      chapter: "01 — 开场",
      lines: ["连接全球品牌", "与 AI 创作者"],
      subtitle: "VINCIS 让品牌方在一个工作流里完成需求简报、AI 创作者匹配、审片、资金托管和成片交付",
      primary: "我是品牌方",
      secondary: "我是创作者",
      loggedInPrimary: "品牌方门户",
      scroll: "向下滚动"
    }
  },
  trust: {
    en: {
      label: "Trusted by teams who ship at paid-social speed",
      brands: ["Google", "Samsung", "Coca-Cola", "Airbnb", "TikTok", "Shopify", "Amazon", "Meta", "Nike", "P&G"]
    },
    zh: {
      label: "服务需要快速出片的全球品牌团队",
      brands: ["Google", "Samsung", "Coca-Cola", "Airbnb", "TikTok", "Shopify", "Amazon", "Meta", "Nike", "P&G"]
    }
  },
  cost: {
    en: {
      chapter: "02 — Cost Break",
      title: "Traditional production, cut open.",
      agency: "Traditional Agency",
      agencyPrice: 50000,
      agencyLabel: "Average campaign",
      studio: "VINCIS",
      studioPrice: 8000,
      studioLabel: "Same deliverable tier",
      save: "Save up to 84%"
    },
    zh: {
      chapter: "02 — 成本切开",
      title: "传统制作模式已经失效",
      agency: "传统广告公司",
      agencyPrice: 360000,
      agencyLabel: "平均投放项目",
      studio: "VINCIS",
      studioPrice: 58000,
      studioLabel: "同等交付标准",
      save: "节省最高 84%"
    }
  },
  network: {
    en: {
      chapter: "03 — Production Network",
      title: "Not a marketplace.",
      highlight: "A curated studio roster.",
      subtitle: "Directors, editors, and AIGC teams — vetted for portfolio quality and delivery discipline.",
      rosterEyebrow: "Live roster",
      statusActive: "In production",
      statusOpen: "Taking briefs",
      matchNote: "Matched in under 48h on average",
      viewAll: "View all →"
    },
    zh: {
      chapter: "03 — 制作网络",
      title: "品牌方直联",
      highlight: "严选的制作方名册",
      subtitle: "导演、剪辑、AI 制作团队 — 按作品集质量与交付纪律筛选",
      rosterEyebrow: "实时名册",
      statusActive: "制作中",
      statusOpen: "可接需求",
      matchNote: "平均 48 小时内完成匹配",
      viewAll: "查看全部 →"
    }
  },
  filmstrip: {
    en: {
      chapter: "04 — From Brief to Film",
      title: "Five beats. One production line.",
      steps: [
        { key: "brief", label: "Brief", desc: "Publish requirements" },
        { key: "match", label: "Match", desc: "Portfolio-first pairing" },
        { key: "production", label: "Production", desc: "Studio execution" },
        { key: "review", label: "Review", desc: "Frame-accurate proofing" },
        { key: "delivery", label: "Delivery", desc: "Final cut release" }
      ]
    },
    zh: {
      chapter: "04 — 从需求到成片",
      title: "五个节拍，一条制作线",
      steps: [
        { key: "brief", label: "需求", desc: "发布需求" },
        { key: "match", label: "匹配", desc: "作品集匹配" },
        { key: "production", label: "制作", desc: "制作执行" },
        { key: "review", label: "审片", desc: "帧级审片" },
        { key: "delivery", label: "交付", desc: "交付成片" }
      ]
    }
  },
  wall: {
    en: {
      chapter: "05 — Quality Wall",
      title: "Work that speaks before you match.",
      viewAll: "Browse all studios"
    },
    zh: {
      chapter: "05 — 品质墙",
      title: "匹配之前，作品先说话",
      viewAll: "浏览全部制作方"
    }
  },
  escrow: {
    en: {
      chapter: "Escrow Trust",
      title: "Trust built into every frame.",
      items: [
        { title: "Escrow payment", desc: "Funds held until milestones clear." },
        { title: "Review protection", desc: "Watermarked proofs, version history." },
        { title: "Delivery unlock", desc: "Release payment when you approve." }
      ]
    },
    zh: {
      chapter: "托管信任",
      title: "每一帧都有信任机制",
      items: [
        { title: "资金托管", desc: "里程碑达成前资金锁定" },
        { title: "审片保护", desc: "水印样片，版本完整留痕" },
        { title: "交付解锁", desc: "验收满意后释放付款" }
      ]
    }
  },
  cta: {
    en: {
      chapter: "07 — Final Cut",
      title: "Ready for your next blockbuster?",
      subtitle: "Join brands already producing cinema-grade ads at a fraction of agency cost.",
      primary: "Start your campaign",
      secondary: "Talk to an expert"
    },
    zh: {
      chapter: "07 — 终场",
      title: "下一支电影级广告，从这里开始",
      subtitle: "已有品牌以远低于代理成本，持续产出电影级广告",
      primary: "启动投放项目",
      secondary: "联系专家"
    }
  }
} as const;

type WidenCopy<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends readonly (infer U)[]
      ? WidenCopy<U>[]
      : T extends object
        ? { [K in keyof T]: WidenCopy<T[K]> }
        : T;

const cinematicCopyTranslations: Partial<{
  [K in keyof typeof cinematicCopy]: Partial<Record<MarketingLocale, WidenCopy<(typeof cinematicCopy)[K]["en"]>>>;
}> = {
  nav: {
    "zh-TW": { cases: "作品", process: "流程", pricing: "價格", resources: "資源", about: "關於我們", login: "登入", start: "開始專案" },
    ja: { cases: "実績", process: "プロセス", pricing: "料金", resources: "リソース", about: "概要", login: "ログイン", start: "プロジェクト開始" },
    ko: { cases: "작업", process: "프로세스", pricing: "가격", resources: "리소스", about: "소개", login: "로그인", start: "프로젝트 시작" },
    ms: { cases: "Kerja", process: "Proses", pricing: "Harga", resources: "Sumber", about: "Tentang", login: "Log masuk", start: "Mulakan projek" },
    km: { cases: "ស្នាដៃ", process: "ដំណើរការ", pricing: "តម្លៃ", resources: "ធនធាន", about: "អំពីយើង", login: "ចូល", start: "ចាប់ផ្តើមគម្រោង" },
    th: { cases: "ผลงาน", process: "กระบวนการ", pricing: "ราคา", resources: "ทรัพยากร", about: "เกี่ยวกับ", login: "เข้าสู่ระบบ", start: "เริ่มโปรเจกต์" },
    vi: { cases: "Dự án", process: "Quy trình", pricing: "Giá", resources: "Tài nguyên", about: "Giới thiệu", login: "Đăng nhập", start: "Bắt đầu dự án" },
    fr: { cases: "Réalisations", process: "Processus", pricing: "Tarifs", resources: "Ressources", about: "À propos", login: "Connexion", start: "Lancer un projet" },
    es: { cases: "Trabajos", process: "Proceso", pricing: "Precios", resources: "Recursos", about: "Acerca de", login: "Iniciar sesión", start: "Iniciar proyecto" }
  },
  network: {
    "zh-TW": {
      chapter: "03 — 製作網絡",
      title: "品牌方直聯",
      highlight: "嚴選的製作方名冊",
      subtitle: "導演、剪輯、AI 製作團隊 — 按作品集品質與交付紀律篩選",
      rosterEyebrow: "即時名冊",
      statusActive: "製作中",
      statusOpen: "可接需求",
      matchNote: "平均 48 小時內完成匹配",
      viewAll: "查看全部 →"
    },
    ja: {
      chapter: "03 — 制作ネットワーク",
      title: "単なるマーケットプレイスではありません。",
      highlight: "厳選されたスタジオ名簿です。",
      subtitle: "ディレクター、編集者、AIGC チームを、作品品質と納品規律で審査しています。",
      rosterEyebrow: "ライブ名簿",
      statusActive: "制作中",
      statusOpen: "ブリーフ受付中",
      matchNote: "平均 48 時間以内にマッチング",
      viewAll: "すべて見る →"
    },
    ko: {
      chapter: "03 — 제작 네트워크",
      title: "마켓플레이스가 아닙니다.",
      highlight: "엄선된 스튜디오 명단입니다.",
      subtitle: "감독, 편집자, AIGC 팀을 포트폴리오 품질과 납품 기준으로 검증합니다.",
      rosterEyebrow: "실시간 명단",
      statusActive: "제작 중",
      statusOpen: "브리프 접수 중",
      matchNote: "평균 48시간 이내 매칭",
      viewAll: "전체 보기 →"
    },
    ms: {
      chapter: "03 — Rangkaian Produksi",
      title: "Bukan marketplace.",
      highlight: "Senarai studio yang dipilih.",
      subtitle: "Pengarah, editor dan pasukan AIGC — disaring untuk kualiti portfolio dan disiplin penghantaran.",
      rosterEyebrow: "Roster langsung",
      statusActive: "Dalam produksi",
      statusOpen: "Menerima brief",
      matchNote: "Dipadankan bawah 48j secara purata",
      viewAll: "Lihat semua →"
    },
    km: {
      chapter: "03 — បណ្តាញផលិតកម្ម",
      title: "មិនមែនជា marketplace ទេ។",
      highlight: "ជាបញ្ជីស្ទូឌីយោដែលបានជ្រើសរើស។",
      subtitle: "អ្នកដឹកនាំ អ្នកកាត់ត និងក្រុម AIGC — ត្រូវបានត្រួតពិនិត្យតាមគុណភាព portfolio និងវិន័យប្រគល់។",
      rosterEyebrow: "បញ្ជីបច្ចុប្បន្ន",
      statusActive: "កំពុងផលិត",
      statusOpen: "កំពុងទទួល brief",
      matchNote: "ផ្គូផ្គងជាមធ្យមក្រោម 48 ម៉ោង",
      viewAll: "មើលទាំងអស់ →"
    },
    th: {
      chapter: "03 — เครือข่ายการผลิต",
      title: "ไม่ใช่ marketplace",
      highlight: "แต่คือรายชื่อสตูดิโอที่คัดแล้ว",
      subtitle: "ผู้กำกับ นักตัดต่อ และทีม AIGC ผ่านการคัดด้วยคุณภาพพอร์ตและวินัยในการส่งมอบ",
      rosterEyebrow: "รายชื่อสด",
      statusActive: "กำลังผลิต",
      statusOpen: "รับบรีฟ",
      matchNote: "จับคู่เฉลี่ยภายใน 48 ชม.",
      viewAll: "ดูทั้งหมด →"
    },
    vi: {
      chapter: "03 — Mạng lưới sản xuất",
      title: "Không phải marketplace.",
      highlight: "Đó là danh sách studio được tuyển chọn.",
      subtitle: "Đạo diễn, editor và đội AIGC — được thẩm định theo chất lượng portfolio và kỷ luật giao hàng.",
      rosterEyebrow: "Danh sách đang hoạt động",
      statusActive: "Đang sản xuất",
      statusOpen: "Đang nhận brief",
      matchNote: "Ghép trung bình dưới 48 giờ",
      viewAll: "Xem tất cả →"
    },
    fr: {
      chapter: "03 — Réseau de production",
      title: "Pas une marketplace.",
      highlight: "Un roster de studios sélectionnés.",
      subtitle: "Réalisateurs, monteurs et équipes AIGC — évalués pour la qualité du portfolio et la discipline de livraison.",
      rosterEyebrow: "Roster en direct",
      statusActive: "En production",
      statusOpen: "Briefs ouverts",
      matchNote: "Matching en moins de 48 h en moyenne",
      viewAll: "Tout voir →"
    },
    es: {
      chapter: "03 — Red de producción",
      title: "No es un marketplace.",
      highlight: "Es una cartera de estudios seleccionados.",
      subtitle: "Directores, editores y equipos AIGC, evaluados por calidad de portfolio y disciplina de entrega.",
      rosterEyebrow: "Roster en vivo",
      statusActive: "En producción",
      statusOpen: "Acepta briefs",
      matchNote: "Matching en menos de 48 h de media",
      viewAll: "Ver todo →"
    }
  },
  escrow: {
    "zh-TW": {
      chapter: "託管信任",
      title: "每一幀都有信任機制",
      items: [
        { title: "資金託管", desc: "里程碑達成前資金鎖定" },
        { title: "審片保護", desc: "水印樣片，版本完整留痕" },
        { title: "交付解鎖", desc: "驗收滿意後釋放付款" }
      ]
    },
    ja: {
      chapter: "エスクロー信頼",
      title: "すべてのフレームに信頼を組み込みます。",
      items: [
        { title: "エスクロー支払い", desc: "マイルストーン通過まで資金を保護。" },
        { title: "レビュー保護", desc: "透かし入りプレビューとバージョン履歴。" },
        { title: "納品解除", desc: "承認時に支払いをリリース。" }
      ]
    },
    ko: {
      chapter: "에스크로 신뢰",
      title: "모든 프레임에 신뢰를 내장합니다.",
      items: [
        { title: "에스크로 결제", desc: "마일스톤 통과 전까지 자금을 보호합니다." },
        { title: "리뷰 보호", desc: "워터마크 프루프와 버전 기록." },
        { title: "납품 해제", desc: "승인 시 결제를 릴리스합니다." }
      ]
    },
    ms: {
      chapter: "Kepercayaan Escrow",
      title: "Kepercayaan dibina dalam setiap bingkai.",
      items: [
        { title: "Bayaran escrow", desc: "Dana dipegang sehingga milestone selesai." },
        { title: "Perlindungan semakan", desc: "Proof berwatermark dan sejarah versi." },
        { title: "Buka penghantaran", desc: "Lepaskan bayaran apabila anda meluluskan." }
      ]
    },
    km: {
      chapter: "ទំនុកចិត្ត Escrow",
      title: "ទំនុកចិត្តត្រូវបានដាក់ក្នុង frame នីមួយៗ។",
      items: [
        { title: "ការទូទាត់ escrow", desc: "ទុនត្រូវបានកាន់ទុករហូតដល់ milestone សម្រេច។" },
        { title: "ការពារការពិនិត្យ", desc: "proof មាន watermark និងប្រវត្តិ version។" },
        { title: "បើកការប្រគល់", desc: "ដោះលែងការទូទាត់នៅពេលអ្នកអនុម័ត។" }
      ]
    },
    th: {
      chapter: "ความเชื่อมั่นเอสโครว์",
      title: "ความเชื่อมั่นถูกฝังอยู่ในทุกเฟรม",
      items: [
        { title: "ชำระผ่านเอสโครว์", desc: "เงินถูกถือไว้จนกว่า milestone จะผ่าน" },
        { title: "คุ้มครองการรีวิว", desc: "ไฟล์ proof มีลายน้ำและประวัติเวอร์ชัน" },
        { title: "ปลดล็อกการส่งมอบ", desc: "ปล่อยเงินเมื่อคุณอนุมัติ" }
      ]
    },
    vi: {
      chapter: "Niềm tin ký quỹ",
      title: "Niềm tin được tích hợp trong từng khung hình.",
      items: [
        { title: "Thanh toán ký quỹ", desc: "Tiền được giữ cho đến khi mốc được thông qua." },
        { title: "Bảo vệ duyệt", desc: "Bản proof có watermark và lịch sử phiên bản." },
        { title: "Mở khóa giao hàng", desc: "Giải ngân khi bạn phê duyệt." }
      ]
    },
    fr: {
      chapter: "Confiance escrow",
      title: "La confiance intégrée à chaque image.",
      items: [
        { title: "Paiement escrow", desc: "Les fonds restent bloqués jusqu'à validation des jalons." },
        { title: "Protection de revue", desc: "Preuves watermarkées et historique des versions." },
        { title: "Déblocage livraison", desc: "Libérez le paiement à votre approbation." }
      ]
    },
    es: {
      chapter: "Confianza con escrow",
      title: "Confianza integrada en cada fotograma.",
      items: [
        { title: "Pago con escrow", desc: "Los fondos se retienen hasta validar los hitos." },
        { title: "Protección de revisión", desc: "Pruebas con marca de agua e historial de versiones." },
        { title: "Desbloqueo de entrega", desc: "Libera el pago cuando apruebes." }
      ]
    }
  }
};

function resolveCinematicCopyLocale(locale: Locale | MarketingLocale) {
  if (locale === "zh") return "zh";
  if (locale === "zh-CN") return "zh";
  return locale;
}

export function cinematicText<K extends keyof typeof cinematicCopy>(
  section: K,
  locale: Locale | MarketingLocale
): (typeof cinematicCopy)[K]["en"] {
  const normalizedLocale = resolveCinematicCopyLocale(locale);
  const translated = cinematicCopyTranslations[section]?.[normalizedLocale as MarketingLocale];
  if (translated) return translated as unknown as (typeof cinematicCopy)[K]["en"];
  if (normalizedLocale === "zh" || isChineseLanguage(normalizedLocale)) {
    return cinematicCopy[section].zh as unknown as (typeof cinematicCopy)[K]["en"];
  }
  return cinematicCopy[section].en as (typeof cinematicCopy)[K]["en"];
}
