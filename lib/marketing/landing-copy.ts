import type { Locale, MarketingLocale } from "@/lib/i18n";
import { isChineseLanguage } from "@/lib/i18n";

/** VINCIS marketing copy. */
export const landingCopy = {
  nav: {
    en: {
      howItWorks: "How it works",
      forBrands: "For Brands",
      forCreators: "For Creators",
      caseStudies: "Case Studies",
      pricing: "Pricing",
      login: "Log in",
      startProject: "Start a project"
    },
    zh: {
      howItWorks: "如何运作",
      forBrands: "品牌方",
      forCreators: "创作者",
      caseStudies: "案例",
      pricing: "价格",
      login: "登录",
      startProject: "开始项目"
    }
  },
  split: {
    en: {
      panelEyebrow: "Get started",
      panelTitle: "Sign in or create an account",
      panelSubtitle: "Choose your workspace — brands launch campaigns, creators deliver cinema-grade work.",
      welcomeBack: "Welcome back",
      loggedInSubtitle: "Continue to your VINCIS workspace.",
      brandTab: "Brand",
      creatorTab: "Creator",
      emailLabel: "Work email",
      emailPlaceholder: "you@company.com",
      continue: "Continue",
      orDivider: "or",
      signInBrand: "Brand sign in",
      signInCreator: "Creator sign in",
      noAccount: "New to VINCIS?",
      createAccount: "Create account",
      explorePricing: "View pricing",
      legalNotice: "By continuing you agree to our Terms and Privacy Policy.",
      leftFootnote: "Trusted by global brands for portfolio-first matching, frame-accurate review, and escrow-backed delivery."
    },
    zh: {
      panelEyebrow: "开始使用",
      panelTitle: "登录或注册账号",
      panelSubtitle: "选择您的工作台 — 品牌方发起项目，创作者交付电影级作品",
      welcomeBack: "欢迎回来",
      loggedInSubtitle: "继续进入您的 VINCIS 工作台。",
      brandTab: "品牌方",
      creatorTab: "创作者",
      emailLabel: "工作邮箱",
      emailPlaceholder: "you@company.com",
      continue: "继续",
      orDivider: "或",
      signInBrand: "品牌方登录",
      signInCreator: "创作者登录",
      noAccount: "还没有账号？",
      createAccount: "立即注册",
      explorePricing: "查看价格",
      legalNotice: "继续即表示您同意我们的服务条款与隐私政策。",
      leftFootnote: "全球品牌信赖 — 作品集优先匹配、帧级审片、托管交付"
    }
  },
  hero: {
    en: {
      eyebrow: "AI-powered · Global collaboration",
      titleLine1: "Connecting global brands",
      titleHighlight: "",
      titleLine2: "with AI creators",
      subtitle: "Every great story begins with a connection",
      primary: "I'm a brand",
      secondary: "I'm a creator",
      primaryDescription: "Match with vetted AI studios",
      secondaryDescription: "Join to get global orders",
      trusted: "Built for brand teams shipping paid-social creative at speed",
      showreel: "View the workflow",
      statBudget: "Starting production budget",
      statWindow: "First concept window",
      statDelivery: "Delivery and rights standard",
      trustMarquee: "TRUSTED BY GLOBAL BRAND TEAMS"
    },
    zh: {
      eyebrow: "AI 驱动 · 全球协作",
      titleLine1: "连接全球品牌",
      titleHighlight: "",
      titleLine2: "与 AI 创作者",
      subtitle: "每一个伟大的故事，都始于一次连接",
      primary: "我是品牌方",
      secondary: "我是创作者",
      primaryDescription: "匹配优质 AI 创作者",
      secondaryDescription: "入驻获取全球订单",
      trusted: "为需要高速投放素材的品牌团队而建",
      showreel: "查看流程",
      statBudget: "起步制作预算",
      statWindow: "首轮方案窗口",
      statDelivery: "交付与版权标准",
      trustMarquee: "全球品牌信赖之选"
    }
  },
  heroFeatures: {
    en: [
      { title: "Studio matching", desc: "Vetted teams ranked by portfolio fit", icon: "users" as const },
      { title: "Review rooms", desc: "Frame-level notes and approval management", icon: "play" as const },
      { title: "Escrow workflow", desc: "Milestone-based payment protection", icon: "shield" as const },
      { title: "Creative velocity", desc: "Fewer layers, much higher efficiency", icon: "zap" as const }
    ],
    zh: [
      { title: "制作方匹配", desc: "按作品集与品类精准推荐", icon: "users" as const },
      { title: "审片工作室", desc: "帧级批注，审批管理", icon: "play" as const },
      { title: "托管流程", desc: "按里程碑保护付款与交付", icon: "shield" as const },
      { title: "创意速度", desc: "减少中间层，大幅提升效率", icon: "zap" as const }
    ]
  },
  stats: {
    en: [
      { value: "70%", suffix: "↓", label: "Typical cost reduction" },
      { value: "72h", suffix: "", label: "First concept window" },
      { value: "4K", suffix: "", label: "Delivery standard" },
      { value: "2000+", suffix: "", label: "Vetted studio network" }
    ],
    zh: [
      { value: "70%", suffix: "↓", label: "典型成本下降" },
      { value: "72h", suffix: "", label: "首轮方案窗口" },
      { value: "4K", suffix: "", label: "交付标准" },
      { value: "2000+", suffix: "", label: "严选制作网络" }
    ]
  },
  logos: {
    en: {
      label: "Production model designed for modern marketing teams",
      brands: ["Strategy", "Brief", "Match", "Review", "Escrow", "Delivery", "Rights", "Analytics"]
    },
    zh: {
      label: "为现代市场团队设计的制作模型",
      brands: ["策略", "简报", "匹配", "审片", "托管", "交付", "版权", "分析"]
    }
  },
  cost: {
    en: {
      title: "Traditional ad production is broken",
      body: "Agencies add layers of markup, slow timelines, and opaque revisions.\nWhile brands still need cinema-grade output on paid-social timelines.",
      pains: ["High agency markup", "8–12 week timelines", "Limited creator access", "Endless revision loops"],
      compareTitle: "See the difference",
      traditional: "Traditional Agency",
      studio: "VINCIS",
      saveBadge: "Save about 80%",
      savings: ["Budget saved about 80%", "Time saved about 95-96%"],
      rows: [
        { label: "Average Cost", trad: "$25,000+", studio: "$5,000" },
        { label: "Production Time", trad: "8–12 weeks", studio: "72 hours" },
        { label: "Creator Access", trad: "Through layers", studio: "Direct network" },
        { label: "Revisions", trad: "Extra fees", studio: "Included workflow" }
      ]
    },
    zh: {
      title: "传统广告制作模式已经失效",
      body: "代理层层加价、周期冗长、修改不透明\n品牌方却仍需在付费社交节奏下拿到电影级成片",
      pains: ["代理层层加价", "8–12 周制作周期", "创作者触达受限", "修改陷入循环"],
      compareTitle: "一眼看懂差异",
      traditional: "传统广告公司",
      studio: "VINCIS",
      saveBadge: "节省约 99%",
      savings: ["经费节约约 99%", "时间节约约 95-96%"],
      rows: [
        { label: "平均成本", trad: "$20,000+", studio: "$200+" },
        { label: "制作周期", trad: "8–12 周", studio: "72 小时" },
        { label: "创作者触达", trad: "多层中介", studio: "直连网络" },
        { label: "修改机制", trad: "额外收费", studio: "流程内包含" }
      ]
    }
  },
  steps: {
    en: {
      eyebrow: "HOW IT WORKS",
      title: "From brief to final cut, one production flow",
      subtitle: "",
      items: [
        { num: "01", title: "Share Your Vision", desc: "Upload your brief and references in minutes." },
        { num: "02", title: "Match & Plan", desc: "Portfolio-first matching with vetted studios." },
        { num: "03", title: "Create & Collaborate", desc: "Production, review, and revisions in one flow." },
        { num: "04", title: "Deliver & Scale", desc: "Approve final cut and scale winning creative." }
      ]
    },
    zh: {
      eyebrow: "如何运作",
      title: "从需求简报到成片交付",
      subtitle: "",
      items: [
        { num: "01", title: "提交需求", desc: "上传目标、参考素材与投放要求" },
        { num: "02", title: "匹配制作方", desc: "按品类、风格与作品质量推荐团队" },
        { num: "03", title: "制作协作", desc: "制作、审片、修改在同一流程推进" },
        { num: "04", title: "成片交付", desc: "验收最终版本并释放交付资产" }
      ]
    }
  },
  why: {
    en: {
      eyebrow: "Platform position",
      titleLine1: "Move commercial production out of manual coordination",
      titleLine2: "into one controlled operating system",
      subtitle:
        "VINCIS gives brand teams one place to brief, match studios, review cuts, protect payment, and release campaign-ready assets.",
      items: ["Structured brief intake", "Vetted studio matching", "Frame review and escrow delivery"],
      trustLabel: "Built for global brand standards",
      brands: ["Google", "Coca-Cola", "Samsung", "Airbnb", "TikTok", "Shopify", "Amazon", "Meta"]
    },
    zh: {
      eyebrow: "产品定位",
      titleLine1: "把广告制作从人工协调",
      titleLine2: "升级成一套可控的制作系统",
      subtitle:
        "VINCIS 让品牌团队在一个工作流里完成需求简报、制作方匹配、审片、资金托管和成片交付",
      items: ["把需求变成可执行简报", "按作品集匹配制作团队", "用审片与托管锁定交付质量"],
      trustLabel: "以全球品牌级标准设计",
      brands: ["Google", "Coca-Cola", "Samsung", "Airbnb", "TikTok", "Shopify", "Amazon", "Meta"]
    }
  },
  work: {
    en: {
      eyebrow: "RECENT WORK",
      title: "Work that speaks for itself",
      featured: "Featured",
      viewAll: "View all case studies"
    },
    zh: {
      eyebrow: "精选作品",
      title: "作品自己会说话",
      featured: "精选案例",
      viewAll: "查看全部案例"
    }
  },
  features: {
    en: {
      networkTitle: "Creator network",
      networkItems: ["Curated creators", "Work certification", "Delivery ratings", "Platform escrow"],
      trustTitle: "Trust & escrow",
      trustItems: ["Payment protection", "Review watermarks", "Version history", "Pay when satisfied"]
    },
    zh: {
      networkTitle: "创作者网络",
      networkItems: ["严选创作者", "作品认证", "交付评分", "平台托管"],
      trustTitle: "信任与托管",
      trustItems: ["付款保护", "审片版水印", "版本记录", "满意后结算"]
    }
  },
  cta: {
    en: {
      title: "Bring your next campaign into a real production system",
      subtitle: "Start with a structured brief, matched studios, protected milestones, and a review room your team can actually use.",
      primary: "Start your project",
      secondary: "Talk to an expert"
    },
    zh: {
      title: "把下一次广告项目放进制作系统",
      subtitle: "从结构化需求、制作方匹配、里程碑托管，到团队可用的审片工作室，一次完成",
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

const landingCopyTranslations: Partial<{
  [K in keyof typeof landingCopy]: Partial<Record<MarketingLocale, WidenCopy<(typeof landingCopy)[K]["en"]>>>;
}> = {
  hero: {
    "zh-TW": {
      eyebrow: "AI 驅動 · 全球協作",
      titleLine1: "連接全球品牌",
      titleHighlight: "",
      titleLine2: "與 AI 創作者",
      subtitle: "每一個偉大的故事，都始於一次連接",
      primary: "我是品牌方",
      secondary: "我是創作者",
      primaryDescription: "匹配嚴選 AI 創作者",
      secondaryDescription: "入駐取得全球訂單",
      trusted: "為需要快速投放素材的品牌團隊而建",
      showreel: "查看流程",
      statBudget: "起步製作預算",
      statWindow: "首輪方案窗口",
      statDelivery: "交付與版權標準",
      trustMarquee: "全球品牌信賴"
    },
    ja: {
      eyebrow: "AI駆動 · グローバル協業",
      titleLine1: "グローバルブランドと",
      titleHighlight: "",
      titleLine2: "AI クリエイターをつなぐ",
      subtitle: "すべての偉大な物語は、ひとつのつながりから始まる",
      primary: "ブランドとして始める",
      secondary: "スタジオとして参加",
      primaryDescription: "厳選された AI スタジオとマッチング",
      secondaryDescription: "参加して世界の案件を受ける",
      trusted: "有料ソーシャル向け素材を速く届けるブランドチームのために設計",
      showreel: "ワークフローを見る",
      statBudget: "制作予算の目安",
      statWindow: "初回コンセプトの提出",
      statDelivery: "納品・権利の基準",
      trustMarquee: "世界のブランドに信頼されています"
    },
    ko: {
      eyebrow: "AI 기반 · 글로벌 협업",
      titleLine1: "글로벌 브랜드와",
      titleHighlight: "",
      titleLine2: "AI 크리에이터",
      subtitle: "모든 위대한 이야기는 한 번의 연결에서 시작됩니다",
      primary: "브랜드로 시작하기",
      secondary: "스튜디오로 참여하기",
      primaryDescription: "검증된 AI 스튜디오와 매칭",
      secondaryDescription: "참여하고 글로벌 주문을 받기",
      trusted: "빠르게 유료 소셜 광고 소재를 출시하는 브랜드 팀을 위해 설계",
      showreel: "워크플로 보기",
      statBudget: "시작 제작 예산",
      statWindow: "첫 컨셉 제출 기간",
      statDelivery: "납품 및 권리 기준",
      trustMarquee: "글로벌 브랜드가 신뢰합니다"
    },
    ms: {
      eyebrow: "Dikuasakan AI · Kerjasama global",
      titleLine1: "Menghubungkan jenama global",
      titleHighlight: "",
      titleLine2: "dengan pencipta AI",
      subtitle: "Setiap kisah hebat bermula dengan satu sambungan",
      primary: "Mula sebagai jenama",
      secondary: "Sertai sebagai studio",
      primaryDescription: "Padankan dengan studio AI yang disaring",
      secondaryDescription: "Sertai untuk menerima pesanan global",
      trusted: "Dibina untuk pasukan jenama yang menghantar kreatif sosial berbayar dengan pantas",
      showreel: "Lihat aliran kerja",
      statBudget: "Bajet produksi permulaan",
      statWindow: "Tetingkap konsep pertama",
      statDelivery: "Standard penghantaran & hak",
      trustMarquee: "DIPERCAYAI PASUKAN JENAMA GLOBAL"
    },
    km: {
      eyebrow: "ដំណើរការដោយ AI · សហការពិភពលោក",
      titleLine1: "ភ្ជាប់ម៉ាកសកល",
      titleHighlight: "",
      titleLine2: "ជាមួយអ្នកបង្កើត AI",
      subtitle: "រឿងរសជាតិគ្រប់មួយ ចាប់ផ្តើមពីការភ្ជាប់មួយ",
      primary: "ចាប់ផ្តើមជាម៉ាក",
      secondary: "ចូលរួមជាស្ទូឌីយោ",
      primaryDescription: "ផ្គូផ្គងជាមួយស្ទូឌីយោ AI ដែលបានត្រួតពិនិត្យ",
      secondaryDescription: "ចូលរួមដើម្បីទទួលការងារសកល",
      trusted: "បង្កើតសម្រាប់ក្រុមម៉ាកដែលត្រូវបញ្ចេញ creative លឿនលើ paid social",
      showreel: "មើលលំហូរការងារ",
      statBudget: "ថវិកាផលិតកម្មចាប់ផ្តើម",
      statWindow: "វិន្តមានគំនិតដំបូង",
      statDelivery: "ស្តង់ដារប្រគល់ និងសិទ្ធិ",
      trustMarquee: "ទទួលបានទំនុកចិត្តពីម៉ាកសកល"
    },
    th: {
      eyebrow: "ขับเคลื่อนด้วย AI · ทำงานร่วมทั่วโลก",
      titleLine1: "เชื่อมแบรนด์ทั่วโลก",
      titleHighlight: "",
      titleLine2: "กับครีเอเตอร์ AI",
      subtitle: "เรื่องราวที่ยิ่งใหญ่ทุกเรื่อง เริ่มต้นจากการเชื่อมต่อครั้งหนึ่ง",
      primary: "เริ่มในฐานะแบรนด์",
      secondary: "เข้าร่วมในฐานะสตูดิโอ",
      primaryDescription: "จับคู่กับสตูดิโอ AI ที่ผ่านการคัดเลือก",
      secondaryDescription: "เข้าร่วมเพื่อรับงานระดับโลก",
      trusted: "สร้างมาเพื่อทีมแบรนด์ที่ต้องปล่อยครีเอทีฟ paid social อย่างรวดเร็ว",
      showreel: "ดูเวิร์กโฟลว์",
      statBudget: "งบผลิตเริ่มต้น",
      statWindow: "กรอบเวลาไอเดียแรก",
      statDelivery: "มาตรฐานส่งมอบและลิขสิทธิ์",
      trustMarquee: "ได้รับความไว้วางใจจากแบรนด์ทั่วโลก"
    },
    vi: {
      eyebrow: "AI dẫn dắt · Hợp tác toàn cầu",
      titleLine1: "Kết nối thương hiệu toàn cầu",
      titleHighlight: "",
      titleLine2: "với nhà sáng tạo AI",
      subtitle: "Mọi câu chuyện vĩ đại đều bắt đầu từ một kết nối",
      primary: "Bắt đầu với vai trò thương hiệu",
      secondary: "Tham gia với vai trò studio",
      primaryDescription: "Ghép với các studio AI đã được tuyển chọn",
      secondaryDescription: "Tham gia để nhận đơn hàng toàn cầu",
      trusted: "Xây dựng cho đội ngũ thương hiệu cần xuất bản creative paid social thật nhanh",
      showreel: "Xem quy trình",
      statBudget: "Ngân sách sản xuất khởi điểm",
      statWindow: "Khung thời gian concept đầu",
      statDelivery: "Tiêu chuẩn bàn giao & bản quyền",
      trustMarquee: "ĐƯỢC TIN DÙNG BỞI CÁC THƯƠNG HIỆU TOÀN CẦU"
    },
    fr: {
      eyebrow: "Propulsé par l'IA · Collaboration mondiale",
      titleLine1: "Connecter les marques",
      titleHighlight: "",
      titleLine2: "mondiales aux créateurs IA",
      subtitle: "Chaque grande histoire commence par une connexion",
      primary: "Commencer comme marque",
      secondary: "Rejoindre comme studio",
      primaryDescription: "Être mis en relation avec des studios IA sélectionnés",
      secondaryDescription: "Rejoindre pour recevoir des projets mondiaux",
      trusted: "Conçu pour les équipes de marque qui livrent vite des créations paid social",
      showreel: "Voir le workflow",
      statBudget: "Budget de production de départ",
      statWindow: "Fenêtre du premier concept",
      statDelivery: "Standard de livraison et droits",
      trustMarquee: "APPROUVÉ PAR LES MARQUES MONDIALES"
    },
    es: {
      eyebrow: "Impulsado por IA · Colaboración global",
      titleLine1: "Conectamos marcas globales",
      titleHighlight: "",
      titleLine2: "con creadores de IA",
      subtitle: "Cada gran historia comienza con una conexión",
      primary: "Empezar como marca",
      secondary: "Unirse como estudio",
      primaryDescription: "Conecta con estudios de IA seleccionados",
      secondaryDescription: "Únete para recibir proyectos globales",
      trusted: "Diseñado para equipos de marca que lanzan creatividad paid social con rapidez",
      showreel: "Ver el flujo",
      statBudget: "Presupuesto inicial de producción",
      statWindow: "Ventana del primer concepto",
      statDelivery: "Estándar de entrega y derechos",
      trustMarquee: "CONFIANZA DE MARCAS GLOBALES"
    }
  },
  heroFeatures: {
    "zh-TW": [
      { title: "製作方匹配", desc: "按作品集適配度排序嚴選團隊", icon: "users" },
      { title: "審片工作室", desc: "帧級批註與審批管理", icon: "play" },
      { title: "託管流程", desc: "按里程碑保護付款與交付", icon: "shield" },
      { title: "創意速度", desc: "更少層級，更高效率", icon: "zap" }
    ],
    ja: [
      { title: "スタジオマッチング", desc: "作品適性で厳選チームをランク付け", icon: "users" },
      { title: "レビュー室", desc: "フレーム単位の注釈と承認管理", icon: "play" },
      { title: "エスクロー進行", desc: "マイルストーンごとの支払い保護", icon: "shield" },
      { title: "制作スピード", desc: "中間工程を減らし効率を高める", icon: "zap" }
    ],
    ko: [
      { title: "스튜디오 매칭", desc: "포트폴리오 적합도로 검증 팀을 추천", icon: "users" },
      { title: "리뷰룸", desc: "프레임 단위 코멘트와 승인 관리", icon: "play" },
      { title: "에스크로 워크플로", desc: "마일스톤 기반 결제 보호", icon: "shield" },
      { title: "크리에이티브 속도", desc: "단계를 줄이고 효율을 높입니다", icon: "zap" }
    ],
    ms: [
      { title: "Padanan studio", desc: "Pasukan disaring mengikut kesesuaian portfolio", icon: "users" },
      { title: "Bilik semakan", desc: "Nota per bingkai dan pengurusan kelulusan", icon: "play" },
      { title: "Aliran escrow", desc: "Perlindungan bayaran berasaskan pencapaian", icon: "shield" },
      { title: "Kelajuan kreatif", desc: "Kurang lapisan, lebih cekap", icon: "zap" }
    ],
    km: [
      { title: "ផ្គូផ្គងស្ទូឌីយោ", desc: "ក្រុមដែលបានត្រួតពិនិត្យតាមភាពសមនឹង portfolio", icon: "users" },
      { title: "បន្ទប់ពិនិត្យ", desc: "កំណត់ចំណាំតាម frame និងគ្រប់គ្រងការអនុម័ត", icon: "play" },
      { title: "លំហូរ escrow", desc: "ការពារការទូទាត់តាម milestone", icon: "shield" },
      { title: "ល្បឿនច្នៃប្រឌិត", desc: "កាត់បន្ថយស្រទាប់ និងបង្កើនប្រសិទ្ធភាព", icon: "zap" }
    ],
    th: [
      { title: "จับคู่สตูดิโอ", desc: "ทีมที่คัดแล้วจัดอันดับตามความเหมาะของผลงาน", icon: "users" },
      { title: "ห้องรีวิว", desc: "คอมเมนต์ระดับเฟรมและจัดการอนุมัติ", icon: "play" },
      { title: "เวิร์กโฟลว์เอสโครว์", desc: "คุ้มครองการชำระเงินตาม milestone", icon: "shield" },
      { title: "ความเร็วงานครีเอทีฟ", desc: "ลดชั้นงาน เพิ่มประสิทธิภาพ", icon: "zap" }
    ],
    vi: [
      { title: "Ghép studio", desc: "Đội ngũ được tuyển chọn theo độ phù hợp portfolio", icon: "users" },
      { title: "Phòng duyệt", desc: "Ghi chú theo từng khung hình và quản lý phê duyệt", icon: "play" },
      { title: "Quy trình ký quỹ", desc: "Bảo vệ thanh toán theo từng mốc", icon: "shield" },
      { title: "Tốc độ sáng tạo", desc: "Ít tầng nấc hơn, hiệu quả cao hơn", icon: "zap" }
    ],
    fr: [
      { title: "Matching studio", desc: "Équipes sélectionnées selon l'adéquation du portfolio", icon: "users" },
      { title: "Salle de revue", desc: "Notes image par image et gestion des validations", icon: "play" },
      { title: "Workflow escrow", desc: "Paiement protégé par jalons", icon: "shield" },
      { title: "Vitesse créative", desc: "Moins d'intermédiaires, plus d'efficacité", icon: "zap" }
    ],
    es: [
      { title: "Matching de estudios", desc: "Equipos seleccionados por ajuste de portfolio", icon: "users" },
      { title: "Sala de revisión", desc: "Notas por fotograma y gestión de aprobación", icon: "play" },
      { title: "Flujo con escrow", desc: "Protección de pagos por hitos", icon: "shield" },
      { title: "Velocidad creativa", desc: "Menos capas, mucha más eficiencia", icon: "zap" }
    ]
  },
  cost: {
    "zh-TW": {
      title: "傳統廣告製作模式已經失效",
      body: "代理層層加價、週期冗長、修改不透明\n品牌卻仍需在 paid social 節奏下拿到電影級成片",
      pains: ["代理層層加價", "8–12 週製作週期", "創作者觸達受限", "修改陷入循環"],
      compareTitle: "一眼看懂差異",
      traditional: "傳統廣告公司",
      studio: "VINCIS",
      saveBadge: "節省約 80%",
      savings: ["預算節省約 80%", "時間節省約 95-96%"],
      rows: [
        { label: "平均成本", trad: "$25,000+", studio: "$5,000" },
        { label: "製作週期", trad: "8–12 週", studio: "72 小時" },
        { label: "創作者觸達", trad: "多層中介", studio: "直連網絡" },
        { label: "修改機制", trad: "額外收費", studio: "流程內包含" }
      ]
    },
    ja: {
      title: "従来の広告制作は壊れています",
      body: "代理店は中間マージン、長いスケジュール、不透明な修正を重ねます。\n一方でブランドは paid social の速度で映画品質のアウトプットを必要としています。",
      pains: ["高い代理店マージン", "8〜12週間の制作期間", "クリエイターへのアクセス不足", "終わらない修正ループ"],
      compareTitle: "違いを見る",
      traditional: "従来型代理店",
      studio: "VINCIS",
      saveBadge: "約 80% 節約",
      savings: ["予算を約 80% 節約", "時間を約 95-96% 節約"],
      rows: [
        { label: "平均コスト", trad: "$25,000+", studio: "$5,000" },
        { label: "制作期間", trad: "8〜12週間", studio: "72時間" },
        { label: "クリエイター接点", trad: "複数の中間層経由", studio: "直接ネットワーク" },
        { label: "修正", trad: "追加費用", studio: "含む" }
      ]
    },
    ko: {
      title: "기존 광고 제작 방식은 더 이상 맞지 않습니다",
      body: "대행사는 높은 마진, 느린 일정, 불투명한 수정 과정을 더합니다.\n하지만 브랜드는 paid social 속도에 맞춘 영화급 결과물이 필요합니다.",
      pains: ["높은 대행사 마진", "8~12주 제작 기간", "제한된 크리에이터 접근", "끝없는 수정 루프"],
      compareTitle: "차이를 확인하세요",
      traditional: "전통 대행사",
      studio: "VINCIS",
      saveBadge: "약 80% 절감",
      savings: ["예산 약 80% 절감", "시간 약 95-96% 절감"],
      rows: [
        { label: "평균 비용", trad: "$25,000+", studio: "$5,000" },
        { label: "제작 시간", trad: "8~12주", studio: "72시간" },
        { label: "크리에이터 접근", trad: "여러 단계 경유", studio: "직접 네트워크" },
        { label: "수정", trad: "추가 비용", studio: "포함" }
      ]
    },
    ms: {
      title: "Produksi iklan tradisional sudah rosak",
      body: "Agensi menambah markup, jadual perlahan dan semakan yang tidak telus.\nJenama masih memerlukan hasil bertaraf sinema mengikut tempo paid social.",
      pains: ["Markup agensi tinggi", "Garis masa 8–12 minggu", "Akses pencipta terhad", "Kitaran semakan tidak berakhir"],
      compareTitle: "Lihat bezanya",
      traditional: "Agensi tradisional",
      studio: "VINCIS",
      saveBadge: "Jimat sekitar 80%",
      savings: ["Belanjawan dijimatkan sekitar 80%", "Masa dijimatkan sekitar 95-96%"],
      rows: [
        { label: "Kos purata", trad: "$25,000+", studio: "$5,000" },
        { label: "Masa produksi", trad: "8–12 minggu", studio: "72 jam" },
        { label: "Akses pencipta", trad: "Melalui banyak lapisan", studio: "Rangkaian langsung" },
        { label: "Semakan", trad: "Yuran tambahan", studio: "Termasuk" }
      ]
    },
    km: {
      title: "ផលិតកម្មផ្សព្វផ្សាយបែបចាស់កំពុងខូច",
      body: "ភ្នាក់ងារបន្ថែមថ្លៃ កាលវិភាគយឺត និងការកែប្រែមិនច្បាស់។\nប៉ុន្តែម៉ាកនៅត្រូវការលទ្ធផលកម្រិតភាពយន្តតាមល្បឿន paid social។",
      pains: ["ថ្លៃបន្ថែមខ្ពស់", "ពេលវេលា 8–12 សប្តាហ៍", "ចូលដល់អ្នកបង្កើតបានកំណត់", "ការកែប្រែវិលជុំមិនចប់"],
      compareTitle: "មើលភាពខុសគ្នា",
      traditional: "ភ្នាក់ងារបែបចាស់",
      studio: "VINCIS",
      saveBadge: "សន្សំប្រហែល 80%",
      savings: ["សន្សំថវិកាប្រហែល 80%", "សន្សំពេលប្រហែល 95-96%"],
      rows: [
        { label: "ចំណាយមធ្យម", trad: "$25,000+", studio: "$5,000" },
        { label: "ពេលផលិត", trad: "8–12 សប្តាហ៍", studio: "72 ម៉ោង" },
        { label: "ចូលដល់អ្នកបង្កើត", trad: "តាមស្រទាប់ច្រើន", studio: "បណ្តាញផ្ទាល់" },
        { label: "ការកែប្រែ", trad: "គិតថ្លៃបន្ថែម", studio: "រួមក្នុងលំហូរ" }
      ]
    },
    th: {
      title: "การผลิตโฆษณาแบบเดิมไม่ตอบโจทย์แล้ว",
      body: "เอเจนซี่เพิ่มมาร์กอัป ชั้นงาน และรอบแก้ที่ไม่โปร่งใส\nขณะที่แบรนด์ยังต้องการงานระดับภาพยนตร์ตามความเร็วของ paid social",
      pains: ["มาร์กอัปเอเจนซี่สูง", "ใช้เวลา 8–12 สัปดาห์", "เข้าถึงครีเอเตอร์จำกัด", "รอบแก้ไม่รู้จบ"],
      compareTitle: "ดูความแตกต่าง",
      traditional: "เอเจนซี่แบบเดิม",
      studio: "VINCIS",
      saveBadge: "ประหยัดราว 80%",
      savings: ["ประหยัดงบราว 80%", "ประหยัดเวลาราว 95-96%"],
      rows: [
        { label: "ต้นทุนเฉลี่ย", trad: "$25,000+", studio: "$5,000" },
        { label: "เวลาผลิต", trad: "8–12 สัปดาห์", studio: "72 ชั่วโมง" },
        { label: "การเข้าถึงครีเอเตอร์", trad: "ผ่านหลายชั้น", studio: "เครือข่ายโดยตรง" },
        { label: "การแก้ไข", trad: "คิดเพิ่ม", studio: "รวมแล้ว" }
      ]
    },
    vi: {
      title: "Sản xuất quảng cáo truyền thống đã lỗi thời",
      body: "Agency cộng thêm nhiều tầng chi phí, timeline chậm và vòng sửa thiếu minh bạch.\nTrong khi thương hiệu vẫn cần chất lượng điện ảnh với tốc độ paid social.",
      pains: ["Markup agency cao", "Timeline 8–12 tuần", "Khó tiếp cận nhà sáng tạo", "Vòng sửa kéo dài"],
      compareTitle: "Xem sự khác biệt",
      traditional: "Agency truyền thống",
      studio: "VINCIS",
      saveBadge: "Tiết kiệm khoảng 80%",
      savings: ["Tiết kiệm ngân sách khoảng 80%", "Tiết kiệm thời gian khoảng 95-96%"],
      rows: [
        { label: "Chi phí trung bình", trad: "$25,000+", studio: "$5,000" },
        { label: "Thời gian sản xuất", trad: "8–12 tuần", studio: "72 giờ" },
        { label: "Tiếp cận creator", trad: "Qua nhiều tầng", studio: "Mạng lưới trực tiếp" },
        { label: "Chỉnh sửa", trad: "Tính phí thêm", studio: "Có trong quy trình" }
      ]
    },
    fr: {
      title: "La production publicitaire traditionnelle est cassée",
      body: "Les agences ajoutent marges, délais lents et révisions opaques.\nLes marques ont pourtant besoin d'un rendu cinéma au rythme du paid social.",
      pains: ["Marge agence élevée", "Délais de 8 à 12 semaines", "Accès créateur limité", "Boucles de révision sans fin"],
      compareTitle: "Voyez la différence",
      traditional: "Agence traditionnelle",
      studio: "VINCIS",
      saveBadge: "Économisez environ 80 %",
      savings: ["Budget économisé environ 80 %", "Temps économisé environ 95-96 %"],
      rows: [
        { label: "Coût moyen", trad: "$25,000+", studio: "$5,000" },
        { label: "Temps de production", trad: "8–12 semaines", studio: "72 heures" },
        { label: "Accès créateurs", trad: "Via plusieurs couches", studio: "Réseau direct" },
        { label: "Révisions", trad: "Frais supplémentaires", studio: "Incluses" }
      ]
    },
    es: {
      title: "La producción publicitaria tradicional está rota",
      body: "Las agencias añaden márgenes, plazos lentos y revisiones opacas.\nLas marcas aún necesitan calidad cinematográfica al ritmo de paid social.",
      pains: ["Alto margen de agencia", "Plazos de 8–12 semanas", "Acceso limitado a creadores", "Ciclos de revisión interminables"],
      compareTitle: "Mira la diferencia",
      traditional: "Agencia tradicional",
      studio: "VINCIS",
      saveBadge: "Ahorra alrededor del 80%",
      savings: ["Presupuesto ahorrado alrededor del 80%", "Tiempo ahorrado alrededor del 95-96%"],
      rows: [
        { label: "Coste medio", trad: "$25,000+", studio: "$5,000" },
        { label: "Tiempo de producción", trad: "8–12 semanas", studio: "72 horas" },
        { label: "Acceso a creadores", trad: "A través de capas", studio: "Red directa" },
        { label: "Revisiones", trad: "Costes extra", studio: "Incluidas" }
      ]
    }
  },
  steps: {
    "zh-TW": {
      eyebrow: "如何運作",
      title: "從需求簡報到成片交付",
      subtitle: "",
      items: [
        { num: "01", title: "提交需求", desc: "上傳目標、參考素材與投放要求" },
        { num: "02", title: "匹配製作方", desc: "按品類、風格與作品品質推薦團隊" },
        { num: "03", title: "製作協作", desc: "製作、審片、修改在同一流程推進" },
        { num: "04", title: "成片交付", desc: "驗收最終版本並釋放交付資產" }
      ]
    },
    ja: {
      eyebrow: "仕組み",
      title: "ブリーフから最終カットまで、ひとつの制作フローで",
      subtitle: "",
      items: [
        { num: "01", title: "ビジョンを共有", desc: "ブリーフと参考素材を数分でアップロード" },
        { num: "02", title: "マッチングと設計", desc: "作品重視で厳選スタジオとマッチング" },
        { num: "03", title: "制作と協業", desc: "制作、レビュー、修正を一つの流れで進行" },
        { num: "04", title: "納品と拡張", desc: "最終版を承認し成果の出るクリエイティブを展開" }
      ]
    },
    ko: {
      eyebrow: "작동 방식",
      title: "브리프부터 최종본까지 하나의 제작 흐름",
      subtitle: "",
      items: [
        { num: "01", title: "비전 공유", desc: "브리프와 레퍼런스를 몇 분 만에 업로드" },
        { num: "02", title: "매칭 및 기획", desc: "포트폴리오 우선 방식으로 검증된 스튜디오 매칭" },
        { num: "03", title: "제작과 협업", desc: "제작, 리뷰, 수정이 한 흐름에서 진행" },
        { num: "04", title: "납품과 확장", desc: "최종본을 승인하고 우수한 소재를 확장" }
      ]
    },
    ms: {
      eyebrow: "CARA IA BERFUNGSI",
      title: "Daripada brief ke final cut, satu aliran produksi",
      subtitle: "",
      items: [
        { num: "01", title: "Kongsi visi anda", desc: "Muat naik brief dan rujukan dalam beberapa minit." },
        { num: "02", title: "Padan & rancang", desc: "Padanan portfolio dengan studio yang disaring." },
        { num: "03", title: "Cipta & bekerjasama", desc: "Produksi, semakan dan pembetulan dalam satu aliran." },
        { num: "04", title: "Hantar & skala", desc: "Luluskan final cut dan kembangkan kreatif terbaik." }
      ]
    },
    km: {
      eyebrow: "របៀបដំណើរការ",
      title: "ពី brief ទៅ final cut ក្នុងលំហូរផលិតកម្មតែមួយ",
      subtitle: "",
      items: [
        { num: "01", title: "ចែករំលែកទស្សនៈ", desc: "ផ្ទុក brief និងឯកសារយោងក្នុងប៉ុន្មាននាទី" },
        { num: "02", title: "ផ្គូផ្គង និងរៀបចំផែនការ", desc: "ផ្គូផ្គងតាម portfolio ជាមួយស្ទូឌីយោដែលបានជ្រើស" },
        { num: "03", title: "ផលិត និងសហការ", desc: "ផលិត ពិនិត្យ និងកែប្រែក្នុងលំហូរតែមួយ" },
        { num: "04", title: "ប្រគល់ និងពង្រីក", desc: "អនុម័ត final cut ហើយពង្រីក creative ដែលឈ្នះ" }
      ]
    },
    th: {
      eyebrow: "วิธีการทำงาน",
      title: "จากบรีฟถึงไฟนอลคัตในเวิร์กโฟลว์เดียว",
      subtitle: "",
      items: [
        { num: "01", title: "แชร์วิสัยทัศน์", desc: "อัปโหลดบรีฟและเรฟเฟอเรนซ์ภายในไม่กี่นาที" },
        { num: "02", title: "จับคู่และวางแผน", desc: "จับคู่จากพอร์ตโฟลิโอกับสตูดิโอที่คัดแล้ว" },
        { num: "03", title: "สร้างและร่วมงาน", desc: "ผลิต รีวิว และแก้ไขในกระบวนการเดียว" },
        { num: "04", title: "ส่งมอบและขยายผล", desc: "อนุมัติไฟนอลคัตและขยายงานที่ชนะ" }
      ]
    },
    vi: {
      eyebrow: "CÁCH HOẠT ĐỘNG",
      title: "Từ brief đến final cut trong một quy trình sản xuất",
      subtitle: "",
      items: [
        { num: "01", title: "Chia sẻ tầm nhìn", desc: "Tải brief và tài liệu tham khảo chỉ trong vài phút." },
        { num: "02", title: "Ghép & lên kế hoạch", desc: "Ghép studio đã tuyển chọn theo độ phù hợp portfolio." },
        { num: "03", title: "Sản xuất & cộng tác", desc: "Sản xuất, duyệt và chỉnh sửa trong cùng một luồng." },
        { num: "04", title: "Giao & mở rộng", desc: "Duyệt final cut và mở rộng creative hiệu quả." }
      ]
    },
    fr: {
      eyebrow: "FONCTIONNEMENT",
      title: "Du brief au final cut, un seul flux de production",
      subtitle: "",
      items: [
        { num: "01", title: "Partagez votre vision", desc: "Téléversez votre brief et vos références en quelques minutes." },
        { num: "02", title: "Matching & plan", desc: "Matching orienté portfolio avec des studios sélectionnés." },
        { num: "03", title: "Créer & collaborer", desc: "Production, revue et révisions dans un seul flux." },
        { num: "04", title: "Livrer & scaler", desc: "Validez le final cut et déployez les meilleures créations." }
      ]
    },
    es: {
      eyebrow: "CÓMO FUNCIONA",
      title: "Del brief al corte final, un solo flujo de producción",
      subtitle: "",
      items: [
        { num: "01", title: "Comparte tu visión", desc: "Sube el brief y referencias en minutos." },
        { num: "02", title: "Match y plan", desc: "Matching por portfolio con estudios seleccionados." },
        { num: "03", title: "Crea y colabora", desc: "Producción, revisión y cambios en un solo flujo." },
        { num: "04", title: "Entrega y escala", desc: "Aprueba el final cut y escala la creatividad ganadora." }
      ]
    }
  },
  work: {
    "zh-TW": { eyebrow: "精選作品", title: "作品自己會說話", featured: "精選案例", viewAll: "查看全部案例" },
    ja: { eyebrow: "最近の制作実績", title: "作品がすべてを語ります", featured: "注目", viewAll: "すべての事例を見る" },
    ko: { eyebrow: "최근 작업", title: "작품이 스스로 말합니다", featured: "추천", viewAll: "전체 사례 보기" },
    ms: { eyebrow: "KERJA TERKINI", title: "Hasil kerja yang bercakap sendiri", featured: "Pilihan", viewAll: "Lihat semua kajian kes" },
    km: { eyebrow: "ការងារថ្មីៗ", title: "ស្នាដៃនិយាយដោយខ្លួនវា", featured: "ពិសេស", viewAll: "មើលករណីសិក្សាទាំងអស់" },
    th: { eyebrow: "ผลงานล่าสุด", title: "ผลงานพูดแทนตัวเอง", featured: "แนะนำ", viewAll: "ดูเคสทั้งหมด" },
    vi: { eyebrow: "DỰ ÁN GẦN ĐÂY", title: "Tác phẩm tự nói lên chất lượng", featured: "Nổi bật", viewAll: "Xem tất cả case study" },
    fr: { eyebrow: "RÉALISATIONS RÉCENTES", title: "Des travaux qui parlent d'eux-mêmes", featured: "À la une", viewAll: "Voir tous les cas" },
    es: { eyebrow: "TRABAJOS RECIENTES", title: "Trabajos que hablan por sí solos", featured: "Destacado", viewAll: "Ver todos los casos" }
  },
  features: {
    "zh-TW": {
      networkTitle: "創作者網絡",
      networkItems: ["嚴選創作者", "作品認證", "交付評分", "平台託管"],
      trustTitle: "信任與託管",
      trustItems: ["付款保護", "審片版水印", "版本記錄", "滿意後結算"]
    },
    ja: {
      networkTitle: "クリエイターネットワーク",
      networkItems: ["厳選クリエイター", "作品認証", "納品評価", "プラットフォーム預託"],
      trustTitle: "信頼とエスクロー",
      trustItems: ["支払い保護", "レビュー用ウォーターマーク", "バージョン履歴", "承認後に支払い"]
    },
    ko: {
      networkTitle: "크리에이터 네트워크",
      networkItems: ["엄선된 크리에이터", "작품 인증", "납품 평점", "플랫폼 에스크로"],
      trustTitle: "신뢰와 에스크로",
      trustItems: ["결제 보호", "리뷰 워터마크", "버전 기록", "만족 시 정산"]
    },
    ms: {
      networkTitle: "Rangkaian pencipta",
      networkItems: ["Pencipta dipilih", "Pensijilan kerja", "Penilaian penghantaran", "Escrow platform"],
      trustTitle: "Kepercayaan & escrow",
      trustItems: ["Perlindungan bayaran", "Watermark semakan", "Sejarah versi", "Bayar apabila puas hati"]
    },
    km: {
      networkTitle: "បណ្តាញអ្នកបង្កើត",
      networkItems: ["អ្នកបង្កើតដែលបានជ្រើស", "បញ្ជាក់ស្នាដៃ", "វាយតម្លៃការប្រគល់", "escrow វេទិកា"],
      trustTitle: "ទំនុកចិត្ត និង escrow",
      trustItems: ["ការពារការទូទាត់", "watermark ពិនិត្យ", "ប្រវត្តិ version", "ទូទាត់ពេលពេញចិត្ត"]
    },
    th: {
      networkTitle: "เครือข่ายครีเอเตอร์",
      networkItems: ["ครีเอเตอร์ที่คัดแล้ว", "รับรองผลงาน", "คะแนนการส่งมอบ", "เอสโครว์แพลตฟอร์ม"],
      trustTitle: "ความเชื่อมั่นและเอสโครว์",
      trustItems: ["คุ้มครองการชำระเงิน", "ลายน้ำสำหรับรีวิว", "ประวัติเวอร์ชัน", "จ่ายเมื่อพอใจ"]
    },
    vi: {
      networkTitle: "Mạng lưới nhà sáng tạo",
      networkItems: ["Creator được tuyển chọn", "Chứng nhận tác phẩm", "Đánh giá giao hàng", "Ký quỹ nền tảng"],
      trustTitle: "Niềm tin & ký quỹ",
      trustItems: ["Bảo vệ thanh toán", "Watermark bản duyệt", "Lịch sử phiên bản", "Thanh toán khi hài lòng"]
    },
    fr: {
      networkTitle: "Réseau de créateurs",
      networkItems: ["Créateurs sélectionnés", "Certification des travaux", "Notes de livraison", "Escrow plateforme"],
      trustTitle: "Confiance & escrow",
      trustItems: ["Protection du paiement", "Watermarks de revue", "Historique des versions", "Paiement après satisfaction"]
    },
    es: {
      networkTitle: "Red de creadores",
      networkItems: ["Creadores seleccionados", "Certificación de trabajos", "Calificaciones de entrega", "Escrow de plataforma"],
      trustTitle: "Confianza y escrow",
      trustItems: ["Protección de pagos", "Marcas de agua de revisión", "Historial de versiones", "Paga cuando estés conforme"]
    }
  },
  cta: {
    "zh-TW": {
      title: "把下一次廣告專案放進真正的製作系統",
      subtitle: "從結構化需求、製作方匹配、里程碑託管，到團隊可用的審片工作室，一次完成",
      primary: "啟動投放專案",
      secondary: "聯絡專家"
    },
    ja: {
      title: "次のキャンペーンを本物の制作システムへ",
      subtitle: "構造化ブリーフ、スタジオマッチング、保護されたマイルストーン、チームが使えるレビュー室から始めましょう。",
      primary: "プロジェクトを始める",
      secondary: "専門家に相談"
    },
    ko: {
      title: "다음 캠페인을 진짜 제작 시스템으로 옮기세요",
      subtitle: "구조화된 브리프, 매칭된 스튜디오, 보호되는 마일스톤, 팀이 실제로 쓰는 리뷰룸에서 시작하세요.",
      primary: "프로젝트 시작하기",
      secondary: "전문가와 상담"
    },
    ms: {
      title: "Bawa kempen seterusnya ke dalam sistem produksi sebenar",
      subtitle: "Mulakan dengan brief berstruktur, studio yang dipadankan, milestone terlindung dan bilik semakan yang benar-benar boleh digunakan.",
      primary: "Mulakan projek anda",
      secondary: "Bercakap dengan pakar"
    },
    km: {
      title: "យក campaign បន្ទាប់របស់អ្នកចូលក្នុងប្រព័ន្ធផលិតកម្មពិត",
      subtitle: "ចាប់ផ្តើមពី brief មានរចនាសម្ព័ន្ធ ស្ទូឌីយោដែលបានផ្គូផ្គង milestone ការពារ និងបន្ទប់ពិនិត្យដែលក្រុមអាចប្រើបានពិត។",
      primary: "ចាប់ផ្តើមគម្រោង",
      secondary: "ពិភាក្សាជាមួយអ្នកជំនាញ"
    },
    th: {
      title: "นำแคมเปญถัดไปเข้าสู่ระบบผลิตจริง",
      subtitle: "เริ่มด้วยบรีฟที่เป็นระบบ สตูดิโอที่จับคู่แล้ว milestone ที่ได้รับการคุ้มครอง และห้องรีวิวที่ทีมใช้งานได้จริง",
      primary: "เริ่มโปรเจกต์",
      secondary: "คุยกับผู้เชี่ยวชาญ"
    },
    vi: {
      title: "Đưa chiến dịch tiếp theo vào một hệ thống sản xuất thật sự",
      subtitle: "Bắt đầu bằng brief có cấu trúc, studio phù hợp, các mốc được bảo vệ và phòng duyệt mà đội ngũ có thể dùng thật.",
      primary: "Bắt đầu dự án",
      secondary: "Trao đổi với chuyên gia"
    },
    fr: {
      title: "Faites entrer votre prochaine campagne dans un vrai système de production",
      subtitle: "Démarrez avec un brief structuré, des studios associés, des jalons protégés et une salle de revue réellement utilisable par votre équipe.",
      primary: "Lancer votre projet",
      secondary: "Parler à un expert"
    },
    es: {
      title: "Lleva tu próxima campaña a un sistema real de producción",
      subtitle: "Empieza con un brief estructurado, estudios seleccionados, hitos protegidos y una sala de revisión que tu equipo sí puede usar.",
      primary: "Empezar proyecto",
      secondary: "Hablar con un experto"
    }
  }
};

function resolveMarketingCopyLocale(locale: Locale | MarketingLocale) {
  if (locale === "zh") return "zh";
  if (locale === "zh-CN") return "zh";
  return locale;
}

export function landingText<K extends keyof typeof landingCopy>(
  section: K,
  locale: Locale | MarketingLocale
): (typeof landingCopy)[K]["en"] {
  const normalizedLocale = resolveMarketingCopyLocale(locale);
  const translated = landingCopyTranslations[section]?.[normalizedLocale as MarketingLocale];
  if (translated) return translated as unknown as (typeof landingCopy)[K]["en"];
  if (normalizedLocale === "zh" || isChineseLanguage(normalizedLocale)) {
    return landingCopy[section].zh as unknown as (typeof landingCopy)[K]["en"];
  }
  return landingCopy[section].en as (typeof landingCopy)[K]["en"];
}
