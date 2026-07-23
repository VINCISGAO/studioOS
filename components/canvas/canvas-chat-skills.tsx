"use client";

import {
  BookOpen,
  Film,
  ImageIcon,
  Layers3,
  Palette,
  Sparkles,
  Store,
  Video,
  Wand2
} from "lucide-react";
import {
  canvasChatSkillCardClass,
  CANVAS_CHAT_PANEL_WIDTH
} from "@/lib/canvas/canvas-chat-design";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type CanvasChatSkill = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  icon: typeof Video;
  iconWrapClass: string;
  iconClass: string;
};

const skillsZh: CanvasChatSkill[] = [
  {
    id: "seedance",
    label: "Seedance 2.0 视频创作",
    description: "AI 视频生成与创意制作",
    prompt: "帮我用 Seedance 2.0 创作一支品牌广告视频，先给我创意方向和可执行的 prompt。",
    icon: Video,
    iconWrapClass: "bg-violet-100",
    iconClass: "text-violet-600"
  },
  {
    id: "one-shot",
    label: "一镜到底视频",
    description: "连贯流畅的长镜头视频",
    prompt: "我想做一支一镜到底的产品视频，请给我镜头设计和生成 prompt。",
    icon: Film,
    iconWrapClass: "bg-sky-100",
    iconClass: "text-sky-600"
  },
  {
    id: "instagram",
    label: "Instagram Post",
    description: "精美社媒图文设计",
    prompt: "帮我设计一组适合 Instagram 发布的视觉内容，包括构图和文案方向。",
    icon: ImageIcon,
    iconWrapClass: "bg-rose-100",
    iconClass: "text-rose-500"
  },
  {
    id: "adapt",
    label: "一键跨平台适配",
    description: "自动调整尺寸与格式",
    prompt: "帮我把这个创意适配成 9:16、1:1、16:9 三个平台的版本方案。",
    icon: Layers3,
    iconWrapClass: "bg-emerald-100",
    iconClass: "text-emerald-600"
  },
  {
    id: "logo",
    label: "Logo 设计",
    description: "专业品牌 Logo 设计",
    prompt: "帮我构思一个现代极简 Logo 设计方向，并给出可生成的 prompt。",
    icon: Palette,
    iconWrapClass: "bg-orange-100",
    iconClass: "text-orange-500"
  },
  {
    id: "ugc",
    label: "UGC：生活化上身图",
    description: "真实自然的 UGC 生成",
    prompt: "帮我生成 UGC 风格的生活化上身图创意，要真实、自然、适合电商转化。",
    icon: Store,
    iconWrapClass: "bg-blue-100",
    iconClass: "text-blue-600"
  },
  {
    id: "stylist",
    label: "AI 造型师：高转化模特图",
    description: "高转化率模特图生成",
    prompt: "帮我设计高转化率的模特展示图方案，包括造型、场景和光线。",
    icon: Wand2,
    iconWrapClass: "bg-violet-100",
    iconClass: "text-violet-600"
  },
  {
    id: "all",
    label: "所有 Skills",
    description: "浏览全部技能库",
    prompt: "列出你现在能帮我做的 Canvas 创作能力，并推荐最适合我当前画布的一个。",
    icon: BookOpen,
    iconWrapClass: "bg-zinc-100",
    iconClass: "text-zinc-500"
  }
];

const skillsEn: CanvasChatSkill[] = [
  {
    id: "seedance",
    label: "Seedance 2.0 video",
    description: "AI video generation",
    prompt: "Help me create a brand ad video with Seedance 2.0. Start with creative direction and prompts.",
    icon: Video,
    iconWrapClass: "bg-violet-100",
    iconClass: "text-violet-600"
  },
  {
    id: "one-shot",
    label: "One-shot video",
    description: "Seamless long takes",
    prompt: "I want a one-shot product video. Give me shot design and generation prompts.",
    icon: Film,
    iconWrapClass: "bg-sky-100",
    iconClass: "text-sky-600"
  },
  {
    id: "instagram",
    label: "Instagram Post",
    description: "Social visual design",
    prompt: "Design Instagram-ready visuals with composition and caption direction.",
    icon: ImageIcon,
    iconWrapClass: "bg-rose-100",
    iconClass: "text-rose-500"
  },
  {
    id: "adapt",
    label: "Cross-platform adapt",
    description: "Auto resize and format",
    prompt: "Adapt this idea for 9:16, 1:1, and 16:9 platform versions.",
    icon: Layers3,
    iconWrapClass: "bg-emerald-100",
    iconClass: "text-emerald-600"
  },
  {
    id: "logo",
    label: "Logo design",
    description: "Professional brand logos",
    prompt: "Suggest a modern minimal logo direction with generation prompts.",
    icon: Palette,
    iconWrapClass: "bg-orange-100",
    iconClass: "text-orange-500"
  },
  {
    id: "ugc",
    label: "UGC lifestyle shot",
    description: "Natural UGC imagery",
    prompt: "Create UGC-style lifestyle product imagery ideas for conversion.",
    icon: Store,
    iconWrapClass: "bg-blue-100",
    iconClass: "text-blue-600"
  },
  {
    id: "stylist",
    label: "AI stylist model shot",
    description: "High-converting model photos",
    prompt: "Design a high-converting model showcase with styling, scene, and lighting.",
    icon: Wand2,
    iconWrapClass: "bg-violet-100",
    iconClass: "text-violet-600"
  },
  {
    id: "all",
    label: "All skills",
    description: "Browse the full library",
    prompt: "List what you can help me create on this canvas and recommend the best next step.",
    icon: BookOpen,
    iconWrapClass: "bg-zinc-100",
    iconClass: "text-zinc-500"
  }
];

export function canvasChatSkills(locale: Locale) {
  return locale === "zh" ? skillsZh : skillsEn;
}

export function CanvasChatSkills({
  locale,
  onSelect
}: {
  locale: Locale;
  onSelect: (prompt: string) => void;
}) {
  const skills = canvasChatSkills(locale);

  return (
    <div className="pb-2" style={{ maxWidth: CANVAS_CHAT_PANEL_WIDTH - 32 }}>
      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 shrink-0 text-violet-500" />
          <h3 className="text-[13px] font-semibold text-zinc-900">
            {locale === "zh" ? (
              <>
                试试这些 <span className="text-violet-600">Canvas Skills</span>
              </>
            ) : (
              <>
                Try these <span className="text-violet-600">Canvas Skills</span>
              </>
            )}
          </h3>
        </div>
        <p className="mt-1 text-[11px] text-zinc-400">
          {locale === "zh" ? "选择一个技能，快速开启创作" : "Pick a skill to start creating"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {skills.map((skill) => {
          const Icon = skill.icon;
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => onSelect(skill.prompt)}
              className={canvasChatSkillCardClass}
            >
              <span
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  skill.iconWrapClass
                )}
              >
                <Icon className={cn("h-4 w-4", skill.iconClass)} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold leading-4 text-zinc-900">
                  {skill.label}
                </span>
                <span className="mt-0.5 block text-[10px] leading-4 text-zinc-400">
                  {skill.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
