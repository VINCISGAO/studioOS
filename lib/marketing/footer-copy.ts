import type { MarketingLocale } from "@/lib/i18n";
import { studioOS } from "@/lib/studioos/vocabulary";

export type FooterNavItem = { label: string; href: string };

export type FooterCopy = {
  rights: string;
  story: { lead: string; highlight: string };
  nav: {
    product: { title: string; items: FooterNavItem[] };
    creators: { title: string; items: FooterNavItem[] };
    resources: { title: string; items: FooterNavItem[] };
  };
  features: { label: string; description: string }[];
  cta: { title: string; subtitle: string; button: string };
};

const productLinks: FooterNavItem[] = [
  { label: "", href: "/how-it-works" },
  { label: "", href: "/#how-it-works" },
  { label: "", href: "/#escrow" },
  { label: "", href: "/pricing" }
];

const creatorLinks: FooterNavItem[] = [
  { label: "", href: "/creators" },
  { label: "", href: "/login?role=creator" },
  { label: "", href: "/#escrow" },
  { label: "", href: "/creators" }
];

const resourceLinks: FooterNavItem[] = [
  { label: "", href: "/case-studies" },
  { label: "", href: "/contact" },
  { label: "", href: "/how-it-works" },
  { label: "", href: "/#escrow" }
];

function withLabels(items: FooterNavItem[], labels: string[]): FooterNavItem[] {
  return items.map((item, index) => ({ ...item, label: labels[index] ?? item.label }));
}

export const footerCopy: Record<MarketingLocale, FooterCopy> = {
  en: {
    rights: "All rights reserved.",
    story: { lead: "Every great story begins with a ", highlight: "connection." },
    nav: {
      product: {
        title: "Product",
        items: withLabels(productLinks, ["How brands work", "AI matching", "Review & delivery", "Pricing"])
      },
      creators: {
        title: "Creators",
        items: withLabels(creatorLinks, ["Studio portfolio", "Become a creator", "Delivery standards", "Creator guide"])
      },
      resources: {
        title: "Resources",
        items: withLabels(resourceLinks, ["Case studies", "Help center", "Learning center", "Security & escrow"])
      }
    },
    features: [
      { label: "Global reach", description: "Connecting global brands and creators" },
      { label: "AI powered", description: "Smart matching, efficient collaboration" },
      { label: "Secure escrow", description: "Fund security and data protection" },
      { label: "Fast delivery", description: "Transparent process, rapid completion" }
    ],
    cta: {
      title: "Ready to start your next creative project?",
      subtitle: "Join the network connecting global brands and creators",
      button: "Start"
    }
  },
  "zh-CN": {
    rights: "保留所有权利。",
    story: { lead: "每个伟大故事    都始于一次", highlight: "连接" },
    nav: {
      product: {
        title: "产品",
        items: withLabels(productLinks, ["品牌如何运作", "AI 匹配", "审片与交付", "定价方案"])
      },
      creators: {
        title: "创作者",
        items: withLabels(creatorLinks, ["Studio 作品库", "成为创作者", "交付标准", "创作者指南"])
      },
      resources: {
        title: "资源",
        items: withLabels(resourceLinks, ["案例研究", "帮助中心", "学习中心", "安全与托管"])
      }
    },
    features: [
      { label: "全球连接", description: "汇聚世界品牌与创作者" },
      { label: "AI 驱动", description: "智能匹配，高效协作" },
      { label: "安全托管", description: "资金安全，数据保障" },
      { label: "高效交付", description: "流程透明，极速完成" }
    ],
    cta: {
      title: "准备好开始你的下一次创作了吗？",
      subtitle: "加入全球品牌与创作者的连接网络",
      button: "立即开始"
    }
  },
  "zh-TW": {
    rights: "保留所有權利。",
    story: { lead: "每個偉大故事    都始於一次", highlight: "連接" },
    nav: {
      product: {
        title: "產品",
        items: withLabels(productLinks, ["品牌如何運作", "AI 配對", "審片與交付", "定價方案"])
      },
      creators: {
        title: "創作者",
        items: withLabels(creatorLinks, ["Studio 作品庫", "成為創作者", "交付標準", "創作者指南"])
      },
      resources: {
        title: "資源",
        items: withLabels(resourceLinks, ["案例研究", "幫助中心", "學習中心", "安全與託管"])
      }
    },
    features: [
      { label: "全球連接", description: "匯聚世界品牌與創作者" },
      { label: "AI 驅動", description: "智慧配對，高效協作" },
      { label: "安全託管", description: "資金安全，資料保障" },
      { label: "高效交付", description: "流程透明，極速完成" }
    ],
    cta: {
      title: "準備好開始你的下一次創作了嗎？",
      subtitle: "加入全球品牌與創作者的連接網絡",
      button: "立即開始"
    }
  },
  ja: {
    rights: "無断転載を禁じます。",
    story: { lead: "すべての素晴らしい物語は", highlight: "つながりから始まる。" },
    nav: {
      product: {
        title: "プロダクト",
        items: withLabels(productLinks, ["ブランドの仕組み", "AI マッチング", "レビューと納品", "料金プラン"])
      },
      creators: {
        title: "クリエイター",
        items: withLabels(creatorLinks, ["Studio 作品集", "クリエイターになる", "納品基準", "クリエイターガイド"])
      },
      resources: {
        title: "リソース",
        items: withLabels(resourceLinks, ["事例研究", "ヘルプセンター", "ラーニングセンター", "セキュリティとエスクロー"])
      }
    },
    features: [
      { label: "グローバル接続", description: "世界のブランドとクリエイターをつなぐ" },
      { label: "AI 駆動", description: "スマートなマッチングと効率的な協業" },
      { label: "安全なエスクロー", description: "資金とデータを保護" },
      { label: "迅速な納品", description: "透明なプロセスでスピード完了" }
    ],
    cta: {
      title: "次の制作を始める準備はできましたか？",
      subtitle: "グローバルブランドとクリエイターをつなぐネットワークに参加",
      button: "今すぐ始める"
    }
  },
  ko: {
    rights: "모든 권리 보유.",
    story: { lead: "모든 위대한 이야기는 ", highlight: "연결에서 시작됩니다." },
    nav: {
      product: {
        title: "제품",
        items: withLabels(productLinks, ["브랜드 운영 방식", "AI 매칭", "리뷰 및 납품", "요금제"])
      },
      creators: {
        title: "크리에이터",
        items: withLabels(creatorLinks, ["Studio 포트폴리오", "크리에이터 되기", "납품 기준", "크리에이터 가이드"])
      },
      resources: {
        title: "리소스",
        items: withLabels(resourceLinks, ["사례 연구", "고객센터", "학습 센터", "보안 및 에스크로"])
      }
    },
    features: [
      { label: "글로벌 연결", description: "전 세계 브랜드와 크리에이터 연결" },
      { label: "AI 기반", description: "스마트 매칭과 효율적 협업" },
      { label: "안전한 에스크로", description: "자금과 데이터 보호" },
      { label: "빠른 납품", description: "투명한 프로세스로 신속 완료" }
    ],
    cta: {
      title: "다음 제작을 시작할 준비가 되셨나요?",
      subtitle: "글로벌 브랜드와 크리에이터를 연결하는 네트워크에 참여하세요",
      button: "지금 시작"
    }
  },
  ms: {
    rights: "Hak cipta terpelihara.",
    story: { lead: "Setiap kisah hebat bermula dengan ", highlight: "hubungan." },
    nav: {
      product: {
        title: "Produk",
        items: withLabels(productLinks, ["Cara jenama berfungsi", "Padanan AI", "Semakan & penghantaran", "Pelan harga"])
      },
      creators: {
        title: "Pencipta",
        items: withLabels(creatorLinks, ["Portfolio Studio", "Jadi pencipta", "Standard penghantaran", "Panduan pencipta"])
      },
      resources: {
        title: "Sumber",
        items: withLabels(resourceLinks, ["Kajian kes", "Pusat bantuan", "Pusat pembelajaran", "Keselamatan & escrow"])
      }
    },
    features: [
      { label: "Jangkauan global", description: "Menghubungkan jenama dan pencipta global" },
      { label: "Dikuasakan AI", description: "Padanan pintar, kerjasama cekap" },
      { label: "Escrow selamat", description: "Keselamatan dana dan data" },
      { label: "Penghantaran pantas", description: "Proses telus, siap dengan cepat" }
    ],
    cta: {
      title: "Bersedia untuk projek kreatif seterusnya?",
      subtitle: "Sertai rangkaian yang menghubungkan jenama dan pencipta global",
      button: "Mula sekarang"
    }
  },
  km: {
    rights: "រក្សាសិទ្ធិគ្រប់យ៉ាង។",
    story: { lead: "រឿងដ៏អស្ចារ្យគ្រប់រឿងចាប់ផ្តើមពី", highlight: "ការតភ្ជាប់។" },
    nav: {
      product: {
        title: "ផលិតផល",
        items: withLabels(productLinks, ["របៀបដំណើរការម៉ាក", "ការផ្គូផ្គង AI", "ការពិនិត្យ និងដឹកជញ្ជូន", "ផែនការតម្លៃ"])
      },
      creators: {
        title: "អ្នកបង្កើត",
        items: withLabels(creatorLinks, ["ផលប័ត្រ Studio", "ក្លាយជាអ្នកបង្កើត", "ស្តង់ដារដឹកជញ្ជូន", "មគ្គុទ្ទេសក៍អ្នកបង្កើត"])
      },
      resources: {
        title: "ធនធាន",
        items: withLabels(resourceLinks, ["ករណីសិក្សា", "មជ្ឈមណ្ឌលជំនួយ", "មជ្ឈមណ្ឌលរៀន", "សុវត្ថិភាព និង escrow"])
      }
    },
    features: [
      { label: "តភ្ជាប់ពិភពលោក", description: "ភ្ជាប់ម៉ាក និងអ្នកបង្កើតទូទាំងពិភពលោក" },
      { label: "ដំណើរការដោយ AI", description: "ការផ្គូផ្គងឆ្លាត និងសហការមានប្រសិទ្ធភាព" },
      { label: "Escrow សុវត្ថិភាព", description: "ការពារមូលនិធិ និងទិន្នន័យ" },
      { label: "ដឹកជញ្ជូនរហ័ស", description: "ដំណើរការថ្លាថ្កែ បញ្ចប់យ៉ាងលឿន" }
    ],
    cta: {
      title: "ត្រៀមចាប់ផ្តើមគម្រោងបន្ទាប់របស់អ្នកហើយឬនៅ?",
      subtitle: "ចូលរួមបណ្តាញភ្ជាប់ម៉ាក និងអ្នកបង្កើតពិភពលោក",
      button: "ចាប់ផ្តើមឥឡូវ"
    }
  },
  th: {
    rights: "สงวนลิขสิทธิ์.",
    story: { lead: "เรื่องราวที่ยอดเยี่ยมเริ่มต้นจาก", highlight: "การเชื่อมต่อ" },
    nav: {
      product: {
        title: "ผลิตภัณฑ์",
        items: withLabels(productLinks, ["แบรนด์ทำงานอย่างไร", "AI แมตช์", "รีวิวและส่งมอบ", "แผนราคา"])
      },
      creators: {
        title: "ครีเอเตอร์",
        items: withLabels(creatorLinks, ["พอร์ตโฟลิโอ Studio", "เป็นครีเอเตอร์", "มาตรฐานการส่งมอบ", "คู่มือครีเอเตอร์"])
      },
      resources: {
        title: "ทรัพยากร",
        items: withLabels(resourceLinks, ["กรณีศึกษา", "ศูนย์ช่วยเหลือ", "ศูนย์การเรียนรู้", "ความปลอดภัยและเอสโครว์"])
      }
    },
    features: [
      { label: "เชื่อมต่อทั่วโลก", description: "เชื่อมแบรนด์และครีเอเตอร์ทั่วโลก" },
      { label: "ขับเคลื่อนด้วย AI", description: "แมตช์อัจฉริยะ ทำงานร่วมกันอย่างมีประสิทธิภาพ" },
      { label: "เอสโครว์ปลอดภัย", description: "ปกป้องเงินทุนและข้อมูล" },
      { label: "ส่งมอบรวดเร็ว", description: "กระบวนการโปร่งใส เสร็จเร็ว" }
    ],
    cta: {
      title: "พร้อมเริ่มโปรเจกต์ครีเอทีฟครั้งต่อไปหรือยัง?",
      subtitle: "เข้าร่วมเครือข่ายที่เชื่อมแบรนด์และครีเอเตอร์ทั่วโลก",
      button: "เริ่มเลย"
    }
  },
  vi: {
    rights: "Đã đăng ký bản quyền.",
    story: { lead: "Mọi câu chuyện lớn bắt đầu từ ", highlight: "một kết nối." },
    nav: {
      product: {
        title: "Sản phẩm",
        items: withLabels(productLinks, ["Thương hiệu vận hành thế nào", "Ghép nối AI", "Duyệt & bàn giao", "Bảng giá"])
      },
      creators: {
        title: "Creator",
        items: withLabels(creatorLinks, ["Portfolio Studio", "Trở thành creator", "Tiêu chuẩn bàn giao", "Hướng dẫn creator"])
      },
      resources: {
        title: "Tài nguyên",
        items: withLabels(resourceLinks, ["Nghiên cứu điển hình", "Trung tâm trợ giúp", "Trung tâm học tập", "Bảo mật & ký quỹ"])
      }
    },
    features: [
      { label: "Kết nối toàn cầu", description: "Kết nối thương hiệu và creator toàn cầu" },
      { label: "Hỗ trợ AI", description: "Ghép nối thông minh, cộng tác hiệu quả" },
      { label: "Ký quỹ an toàn", description: "Bảo vệ quỹ và dữ liệu" },
      { label: "Bàn giao nhanh", description: "Quy trình minh bạch, hoàn thành nhanh" }
    ],
    cta: {
      title: "Sẵn sàng bắt đầu dự án sáng tạo tiếp theo?",
      subtitle: "Tham gia mạng lưới kết nối thương hiệu và creator toàn cầu",
      button: "Bắt đầu ngay"
    }
  },
  fr: {
    rights: "Tous droits réservés.",
    story: { lead: "Chaque grande histoire commence par une ", highlight: "connexion." },
    nav: {
      product: {
        title: "Produit",
        items: withLabels(productLinks, ["Fonctionnement marques", "Matching IA", "Relecture & livraison", "Tarifs"])
      },
      creators: {
        title: "Créateurs",
        items: withLabels(creatorLinks, ["Portfolio Studio", "Devenir créateur", "Standards de livraison", "Guide créateur"])
      },
      resources: {
        title: "Ressources",
        items: withLabels(resourceLinks, ["Études de cas", "Centre d'aide", "Centre d'apprentissage", "Sécurité & séquestre"])
      }
    },
    features: [
      { label: "Portée mondiale", description: "Relier marques et créateurs du monde entier" },
      { label: "Propulsé par l'IA", description: "Matching intelligent, collaboration efficace" },
      { label: "Séquestre sécurisé", description: "Protection des fonds et des données" },
      { label: "Livraison rapide", description: "Processus transparent, exécution rapide" }
    ],
    cta: {
      title: "Prêt pour votre prochain projet créatif ?",
      subtitle: "Rejoignez le réseau qui connecte marques et créateurs",
      button: "Commencer"
    }
  },
  es: {
    rights: "Todos los derechos reservados.",
    story: { lead: "Toda gran historia empieza con una ", highlight: "conexión." },
    nav: {
      product: {
        title: "Producto",
        items: withLabels(productLinks, ["Cómo funcionan las marcas", "Matching con IA", "Revisión y entrega", "Precios"])
      },
      creators: {
        title: "Creadores",
        items: withLabels(creatorLinks, ["Portafolio Studio", "Ser creador", "Estándares de entrega", "Guía del creador"])
      },
      resources: {
        title: "Recursos",
        items: withLabels(resourceLinks, ["Casos de estudio", "Centro de ayuda", "Centro de aprendizaje", "Seguridad y depósito"])
      }
    },
    features: [
      { label: "Alcance global", description: "Conecta marcas y creadores de todo el mundo" },
      { label: "Impulsado por IA", description: "Matching inteligente, colaboración eficiente" },
      { label: "Depósito seguro", description: "Protección de fondos y datos" },
      { label: "Entrega rápida", description: "Proceso transparente, finalización veloz" }
    ],
    cta: {
      title: "¿Listo para tu próximo proyecto creativo?",
      subtitle: "Únete a la red que conecta marcas y creadores globales",
      button: "Empezar"
    }
  }
};

export function resolveFooterLocale(locale: string): MarketingLocale {
  if (locale === "zh") return "zh-CN";
  if (locale in footerCopy) return locale as MarketingLocale;
  return "en";
}

export function getFooterCopy(locale: string): FooterCopy {
  return footerCopy[resolveFooterLocale(locale)] ?? footerCopy.en;
}

export function footerProductName(): string {
  return studioOS.productName;
}
