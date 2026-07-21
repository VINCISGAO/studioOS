"use client";

import {
  BookOpen,
  Clapperboard,
  Film,
  ImageIcon,
  Layers3,
  Palette,
  Store,
  Video
} from "lucide-react";
import type { Locale } from "@/lib/i18n";

export type CanvasChatSkill = {
  id: string;
  label: string;
  prompt: string;
  icon: typeof Video;
};

const skillsZh: CanvasChatSkill[] = [
  {
    id: "seedance",
    label: "Seedance 2.0 视频创作",
    prompt: "帮我用 Seedance 2.0 创作一支品牌广告视频，先给我创意方向和可执行的 prompt。",
    icon: Video
  },
  {
    id: "one-shot",
    label: "一镜到底视频",
    prompt: "我想做一支一镜到底的产品视频，请给我镜头设计和生成 prompt。",
    icon: Film
  },
  {
    id: "instagram",
    label: "Instagram Post",
    prompt: "帮我设计一组适合 Instagram 发布的视觉内容，包括构图和文案方向。",
    icon: ImageIcon
  },
  {
    id: "adapt",
    label: "一键跨平台适配",
    prompt: "帮我把这个创意适配成 9:16、1:1、16:9 三个平台的版本方案。",
    icon: Layers3
  },
  {
    id: "logo",
    label: "Logo 设计",
    prompt: "帮我构思一个现代极简 Logo 设计方向，并给出可生成的 prompt。",
    icon: Palette
  },
  {
    id: "ugc",
    label: "UGC：生活化上身图",
    prompt: "帮我生成 UGC 风格的生活化上身图创意，要真实、自然、适合电商转化。",
    icon: Store
  },
  {
    id: "stylist",
    label: "AI 造型师：高转化模特图",
    prompt: "帮我设计高转化率的模特展示图方案，包括造型、场景和光线。",
    icon: Clapperboard
  },
  {
    id: "all",
    label: "所有 Skills",
    prompt: "列出你现在能帮我做的 Canvas 创作能力，并推荐最适合我当前画布的一个。",
    icon: BookOpen
  }
];

const skillsEn: CanvasChatSkill[] = [
  {
    id: "seedance",
    label: "Seedance 2.0 video",
    prompt: "Help me create a brand ad video with Seedance 2.0. Start with creative direction and prompts.",
    icon: Video
  },
  {
    id: "one-shot",
    label: "One-shot video",
    prompt: "I want a one-shot product video. Give me shot design and generation prompts.",
    icon: Film
  },
  {
    id: "instagram",
    label: "Instagram Post",
    prompt: "Design Instagram-ready visuals with composition and caption direction.",
    icon: ImageIcon
  },
  {
    id: "adapt",
    label: "Cross-platform adapt",
    prompt: "Adapt this idea for 9:16, 1:1, and 16:9 platform versions.",
    icon: Layers3
  },
  {
    id: "logo",
    label: "Logo design",
    prompt: "Suggest a modern minimal logo direction with generation prompts.",
    icon: Palette
  },
  {
    id: "ugc",
    label: "UGC lifestyle shot",
    prompt: "Create UGC-style lifestyle product imagery ideas for conversion.",
    icon: Store
  },
  {
    id: "stylist",
    label: "AI stylist model shot",
    prompt: "Design a high-converting model showcase with styling, scene, and lighting.",
    icon: Clapperboard
  },
  {
    id: "all",
    label: "All skills",
    prompt: "List what you can help me create on this canvas and recommend the best next step.",
    icon: BookOpen
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
    <div className="px-4 py-6">
      <h3 className="text-sm font-semibold text-zinc-900">
        {locale === "zh" ? "试试这些 Canvas Skills" : "Try these Canvas skills"}
      </h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {skills.map((skill) => {
          const Icon = skill.icon;
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => onSelect(skill.prompt)}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              <Icon className="h-3.5 w-3.5 text-zinc-500" />
              {skill.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
