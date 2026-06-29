export type CreativeDnaField = {
  key: string;
  label: { en: string; zh: string };
  value: string;
};

export const demoCreativeDna: CreativeDnaField[] = [
  { key: "color", label: { en: "Color", zh: "色彩" }, value: "#1D1D1F · #F5F5F7 · accent #0071E3" },
  { key: "typography", label: { en: "Typography", zh: "字体" }, value: "SF Pro Display · tight tracking · large headlines" },
  { key: "transitions", label: { en: "Transitions", zh: "转场" }, value: "Soft dissolve · product hero push-in" },
  { key: "music", label: { en: "Music", zh: "音乐" }, value: "Minimal electronic · 92 BPM · no vocal" },
  { key: "hook", label: { en: "Hook", zh: "开场钩子" }, value: "Product macro in first 1.2s" },
  { key: "cta", label: { en: "CTA", zh: "行动号召" }, value: "Shop now · bottom third · white on black" },
  { key: "pacing", label: { en: "Pacing", zh: "节奏" }, value: "9–15s · 3 beats · hold final frame 1.5s" },
  { key: "voice", label: { en: "Voice", zh: "旁白" }, value: "Calm US female · no hard sell" },
  { key: "logo", label: { en: "Logo rules", zh: "Logo 规范" }, value: "End card only · min 12% width · clear space 1×" }
];
