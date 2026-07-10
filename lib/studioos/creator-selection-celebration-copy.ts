import type { Locale } from "@/lib/i18n";

export function tCreatorSelectionCelebration(locale: Locale) {
  if (locale === "zh") {
    return {
      modalTitle: "恭喜，正式达成合作！",
      modalSubtitle: "品牌已确认与你合作。项目表单、审片中心与交付流程现已开启。",
      benefits: [
        {
          title: "正式项目已生成",
          body: "工作台已出现完整项目表单，可查看品牌需求与协作信息。"
        },
        {
          title: "审片中心已开启",
          body: "可进入审片中心查看流程，确认创意方向后即可上传 V1。"
        },
        {
          title: "交付流程已就绪",
          body: "项目状态为 Active Project，可开始与品牌确认创意并推进制作。"
        }
      ],
      primaryCta: "进入项目工作台",
      secondaryCta: "前往审片中心"
    };
  }

  return {
    modalTitle: "Congratulations — you're officially on the project!",
    modalSubtitle:
      "The brand confirmed you as their creator. Your project form, review center, and delivery flow are now open.",
    benefits: [
      {
        title: "Active project created",
        body: "Your workspace now includes the full project brief and collaboration tools."
      },
      {
        title: "Review center unlocked",
        body: "Open the review center anytime. Confirm creative direction, then upload V1."
      },
      {
        title: "Delivery flow ready",
        body: "Project status is Active Project — align on creative direction and start production."
      }
    ],
    primaryCta: "Open project workspace",
    secondaryCta: "Go to review center"
  };
}
