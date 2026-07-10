import type { Locale } from "@/lib/i18n";

export const CREATIVE_BRIEF_SECTIONS = [
  { id: "overview", number: 1, label: { zh: "项目概览", en: "Project overview" } },
  { id: "creative", number: 2, label: { zh: "创意方向", en: "Creative direction" } },
  { id: "production", number: 3, label: { zh: "制作要求", en: "Production" } },
  { id: "assets", number: 4, label: { zh: "素材与参考", en: "Assets & refs" } },
  { id: "details", number: 5, label: { zh: "更多细节", en: "More details" }, optional: true },
  { id: "budget", number: 6, label: { zh: "预算与时间", en: "Budget & time" } }
] as const;

export const VIDEO_DURATION_OPTIONS = ["6s", "10s", "15s", "30s", "45s", "60s", "90s", "custom"] as const;

export const STYLE_OPTIONS = [
  { id: "cinematic", icon: "film", label: { zh: "电影感", en: "Cinematic" } },
  { id: "luxury", icon: "gem", label: { zh: "奢华", en: "Luxury" } },
  { id: "minimal", icon: "minimize", label: { zh: "极简", en: "Minimal" } },
  { id: "documentary", icon: "camera", label: { zh: "纪录片", en: "Documentary" } },
  { id: "lifestyle", icon: "sun", label: { zh: "生活方式", en: "Lifestyle" } },
  { id: "fashion", icon: "shirt", label: { zh: "时尚", en: "Fashion" } },
  { id: "premium", icon: "sparkles", label: { zh: "精致", en: "Premium" } },
  { id: "humor", icon: "smile", label: { zh: "幽默", en: "Humor" } },
  { id: "viral", icon: "zap", label: { zh: "病毒式", en: "Viral" } },
  { id: "ai", icon: "bot", label: { zh: "AI 生成", en: "AI generated" } },
  { id: "animation", icon: "clapperboard", label: { zh: "动画", en: "Animation" } },
  { id: "cartoon", icon: "palette", label: { zh: "卡通", en: "Cartoon" } }
] as const;

export const TONE_OPTIONS = [
  { id: "inspiring", label: { zh: "鼓舞", en: "Inspiring" } },
  { id: "premium", label: { zh: "高端", en: "Premium" } },
  { id: "modern", label: { zh: "现代", en: "Modern" } },
  { id: "humorous", label: { zh: "幽默", en: "Humorous" } },
  { id: "bold", label: { zh: "大胆", en: "Bold" } },
  { id: "simple", label: { zh: "简约", en: "Simple" } },
  { id: "other", label: { zh: "其他", en: "Other" } }
] as const;

export const AUDIENCE_AGE_OPTIONS = [
  { value: "18-24", label: { zh: "18-24 岁", en: "18-24" } },
  { value: "25-34", label: { zh: "25-34 岁", en: "25-34" } },
  { value: "35-44", label: { zh: "35-44 岁", en: "35-44" } },
  { value: "45+", label: { zh: "45 岁以上", en: "45+" } }
] as const;

export const AUDIENCE_REGION_OPTIONS = [
  { value: "global", label: { zh: "全球", en: "Global" } },
  { value: "us", label: { zh: "美国", en: "United States" } },
  { value: "eu", label: { zh: "欧洲", en: "Europe" } },
  { value: "sea", label: { zh: "东南亚", en: "Southeast Asia" } },
  { value: "cn", label: { zh: "中国大陆", en: "Mainland China" } }
] as const;

export const RESOLUTION_OPTIONS = ["4K", "1080p", "720p"] as const;
export const FPS_OPTIONS = ["24 fps", "30 fps", "60 fps"] as const;

export const BRAND_ASSET_SLOTS = [
  { id: "logo", label: { zh: "Logo", en: "Logo" } },
  { id: "brand_guide", label: { zh: "品牌指南", en: "Brand guide" } },
  { id: "product_photos", label: { zh: "产品照片", en: "Product photos" } },
  { id: "existing_videos", label: { zh: "现有视频", en: "Existing videos" } },
  { id: "script", label: { zh: "脚本", en: "Script" } },
  { id: "voiceover", label: { zh: "配音", en: "Voiceover" } },
  { id: "bgm", label: { zh: "背景音乐", en: "BGM" } },
  { id: "fonts", label: { zh: "字体", en: "Fonts" } }
] as const;

export const MUST_INCLUDE_OPTIONS = [
  { id: "logo", label: { zh: "Logo", en: "Logo" } },
  { id: "product", label: { zh: "产品", en: "Product" } },
  { id: "url", label: { zh: "网址", en: "URL" } },
  { id: "slogan", label: { zh: "口号", en: "Slogan" } },
  { id: "people", label: { zh: "人物", en: "People" } },
  { id: "unboxing", label: { zh: "开箱", en: "Unboxing" } }
] as const;

export const MUST_AVOID_OPTIONS = [
  { id: "too_dark", label: { zh: "太暗", en: "Too dark" } },
  { id: "no_cartoon", label: { zh: "不要卡通/3D", en: "No cartoon/3D" } },
  { id: "no_heavy_ai", label: { zh: "不要重 AI 感", en: "No heavy AI feel" } },
  { id: "no_slow", label: { zh: "不要慢节奏", en: "No slow pace" } },
  { id: "no_bw", label: { zh: "不要黑白", en: "No B&W" } },
  { id: "no_real_people", label: { zh: "不要真人", en: "No real people" } },
  { id: "no_children", label: { zh: "不要儿童", en: "No children" } },
  { id: "no_animals", label: { zh: "不要动物", en: "No animals" } }
] as const;

export const INDUSTRY_OPTIONS: Record<Locale, string[]> = {
  zh: ["消费品", "美妆护肤", "食品饮料", "科技数码", "时尚服饰", "旅游酒店", "金融服务", "其他"],
  en: ["Consumer goods", "Beauty", "Food & beverage", "Tech", "Fashion", "Travel", "Finance", "Other"]
};

export function labelForOption<T extends { label: Record<Locale, string> }>(item: T, locale: Locale) {
  return item.label[locale];
}
