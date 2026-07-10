"use client";

import {
  BriefCharCount,
  BriefFieldLabel,
  BriefPurpleChip,
  BriefSectionCard
} from "@/components/studioos/brand-creative-brief/brand-creative-brief-ui";
import {
  AspectIcon,
  styleIconMap,
  toggleList,
  type BriefSectionsProps
} from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections-shared";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  AUDIENCE_AGE_OPTIONS,
  AUDIENCE_REGION_OPTIONS,
  FPS_OPTIONS,
  INDUSTRY_OPTIONS,
  RESOLUTION_OPTIONS,
  STYLE_OPTIONS,
  TONE_OPTIONS,
  VIDEO_DURATION_OPTIONS,
  labelForOption
} from "@/lib/studioos/brand-creative-brief-options";
import { BRAND_VIDEO_ASPECT_RATIOS } from "@/lib/studioos/brand-campaign-options";
import { objectiveOptions } from "@/lib/studioos/brand-brief-options";
import { cn } from "@/lib/utils";

export function BrandCreativeBriefPrimarySections(props: BriefSectionsProps) {
  const { locale, form, patch, onAspectRatioSelect, isPending } = props;
  const objectives = objectiveOptions(locale);
  const aspectRatioOptions = BRAND_VIDEO_ASPECT_RATIOS[locale];

  return (
    <>
      <BriefSectionCard
        id="brief-section-overview"
        number={1}
        locale={locale}
        title={locale === "zh" ? "项目概览" : "Project overview"}
        subtitle={locale === "zh" ? "告诉我们你的项目和品牌基本信息" : "Tell us about your project and brand"}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <BriefFieldLabel label={locale === "zh" ? "项目名称" : "Project name"} required />
              <Input
                value={form.projectTitle}
                onChange={(e) => patch("projectTitle", e.target.value.slice(0, 60))}
                placeholder={locale === "zh" ? "例如：Summer Campaign 2026" : "e.g. Summer Campaign 2026"}
                className="h-11 rounded-xl"
              />
              <BriefCharCount current={form.projectTitle.length} max={60} />
            </div>
            <div className="space-y-2">
              <BriefFieldLabel label={locale === "zh" ? "您需要什么广告？" : "What kind of ad do you need?"} required />
              <Input
                value={form.adOneLiner}
                onChange={(e) => patch("adOneLiner", e.target.value.slice(0, 100))}
                placeholder={locale === "zh" ? "用一句话描述您的需求" : "Describe your need in one sentence"}
                className="h-11 rounded-xl"
              />
              <BriefCharCount current={form.adOneLiner.length} max={100} />
            </div>
            <div className="space-y-2">
              <BriefFieldLabel
                label={locale === "zh" ? "详细描述您的需求" : "Detailed description"}
                required
                hint={locale === "zh" ? "描述创意想法、目标受众、风格偏好等" : "Creative ideas, audience, style preferences…"}
              />
              <Textarea
                value={form.productDescription || form.rawSummary}
                onChange={(e) => {
                  patch("productDescription", e.target.value.slice(0, 1500));
                  patch("rawSummary", e.target.value.slice(0, 1500));
                }}
                rows={6}
                className="min-h-[140px] resize-y rounded-xl"
                placeholder={
                  locale === "zh"
                    ? "请描述您的创意想法、目标受众、风格偏好、必须包含的元素等…"
                    : "Describe creative ideas, audience, style, must-haves…"
                }
              />
              <BriefCharCount current={(form.productDescription || form.rawSummary).length} max={1500} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <BriefFieldLabel label={locale === "zh" ? "产品 / 服务名称" : "Product / service name"} />
              <Input value={form.productName} onChange={(e) => patch("productName", e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <BriefFieldLabel label={locale === "zh" ? "所属行业" : "Industry"} />
              <Select value={form.industry} onValueChange={(value) => patch("industry", value)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder={locale === "zh" ? "选择行业" : "Select industry"} />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS[locale].map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <BriefFieldLabel label={locale === "zh" ? "品牌名称" : "Brand name"} />
              <Input value={form.brandName} onChange={(e) => patch("brandName", e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <BriefFieldLabel label={locale === "zh" ? "品牌官网" : "Brand website"} />
              <Input
                value={form.brandWebsite || form.productUrl}
                onChange={(e) => {
                  patch("brandWebsite", e.target.value);
                  patch("productUrl", e.target.value);
                }}
                placeholder="https://"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </div>
      </BriefSectionCard>

      <BriefSectionCard id="brief-section-creative" number={2} locale={locale} title={locale === "zh" ? "创意方向" : "Creative direction"}>
        <div className="space-y-2">
          <BriefFieldLabel label={locale === "zh" ? "视频时长" : "Video duration"} required />
          <div className="flex flex-wrap gap-2">
            {VIDEO_DURATION_OPTIONS.map((item) => (
              <BriefPurpleChip
                key={item}
                active={form.videoDuration === item}
                disabled={isPending}
                onClick={() => patch("videoDuration", item)}
              >
                {item === "custom" ? (locale === "zh" ? "自定义" : "Custom") : item}
              </BriefPurpleChip>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <BriefFieldLabel label={locale === "zh" ? "风格（可多选）" : "Style (multi-select)"} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {STYLE_OPTIONS.map((item) => {
              const Icon = styleIconMap[item.icon];
              const active = form.creativeStyles.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => patch("creativeStyles", toggleList(form.creativeStyles, item.id))}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition",
                    active
                      ? "border-violet-600 bg-violet-50 text-violet-700"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{labelForOption(item, locale)}</span>
                </button>
              );
            })}
          </div>
          <Input
            value={form.creativeStyleCustom}
            onChange={(e) => patch("creativeStyleCustom", e.target.value)}
            placeholder={locale === "zh" ? "自定义风格" : "Custom style"}
            className="mt-2 h-10 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <BriefFieldLabel label={locale === "zh" ? "基调 / 氛围" : "Tone / atmosphere"} />
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((item) => (
              <BriefPurpleChip
                key={item.id}
                active={form.creativeTones.includes(item.id)}
                onClick={() => patch("creativeTones", toggleList(form.creativeTones, item.id))}
              >
                {labelForOption(item, locale)}
              </BriefPurpleChip>
            ))}
          </div>
          <Input
            value={form.creativeToneCustom}
            onChange={(e) => patch("creativeToneCustom", e.target.value)}
            placeholder={locale === "zh" ? "自定义基调" : "Custom tone"}
            className="h-10 rounded-xl"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <BriefFieldLabel label={locale === "zh" ? "目标受众" : "Target audience"} required />
            <div className="grid gap-2 sm:grid-cols-2">
              <Select value={form.audienceAge} onValueChange={(value) => patch("audienceAge", value)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder={locale === "zh" ? "年龄段" : "Age range"} />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_AGE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label[locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.audienceRegion} onValueChange={(value) => patch("audienceRegion", value)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder={locale === "zh" ? "地区" : "Region"} />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_REGION_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label[locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex rounded-xl border border-zinc-200 p-1">
              {(["all", "male", "female"] as const).map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => patch("audienceGender", gender)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
                    form.audienceGender === gender ? "bg-violet-600 text-white" : "text-zinc-600"
                  )}
                >
                  {gender === "all"
                    ? locale === "zh"
                      ? "全部"
                      : "All"
                    : gender === "male"
                      ? locale === "zh"
                        ? "男性"
                        : "Male"
                      : locale === "zh"
                        ? "女性"
                        : "Female"}
                </button>
              ))}
            </div>
            <Textarea
              value={form.audienceDescription}
              onChange={(e) => patch("audienceDescription", e.target.value)}
              rows={2}
              className="rounded-xl"
              placeholder={locale === "zh" ? "补充受众描述" : "Additional audience notes"}
            />
          </div>
          <div className="space-y-2">
            <BriefFieldLabel label={locale === "zh" ? "主要目标" : "Primary goal"} required />
            <Select value={form.objective} onValueChange={(value) => patch("objective", value as BriefFormState["objective"])}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {objectives.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </BriefSectionCard>

      <BriefSectionCard id="brief-section-production" number={3} locale={locale} title={locale === "zh" ? "制作要求" : "Production requirements"}>
        <div className="space-y-2">
          <BriefFieldLabel label={locale === "zh" ? "视频比例" : "Aspect ratio"} required />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {aspectRatioOptions.map((option) => {
              const active = form.aspectRatio === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => onAspectRatioSelect(option.id)}
                  className={cn(
                    "rounded-2xl border px-3 py-4 text-left transition",
                    active
                      ? "border-violet-600 bg-violet-50 text-violet-700"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  )}
                >
                  <div className={cn("mb-2", active ? "text-violet-600" : "text-zinc-400")}>
                    <AspectIcon ratio={option.id} />
                  </div>
                  <p className="text-sm font-semibold">{option.label}</p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{locale === "zh" ? "分辨率" : "Resolution"}</Label>
            <Select value={form.resolution} onValueChange={(value) => patch("resolution", value)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_OPTIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{locale === "zh" ? "帧率" : "Frame rate"}</Label>
            <Select value={form.frameRate} onValueChange={(value) => patch("frameRate", value)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FPS_OPTIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{locale === "zh" ? "视频数量" : "Quantity"}</Label>
            <div className="flex h-11 items-center rounded-xl border border-zinc-200">
              <button
                type="button"
                className="px-4 text-lg text-zinc-500"
                onClick={() => patch("videoQuantity", Math.max(1, form.videoQuantity - 1))}
              >
                −
              </button>
              <span className="flex-1 text-center text-sm font-semibold">{form.videoQuantity}</span>
              <button
                type="button"
                className="px-4 text-lg text-zinc-500"
                onClick={() => patch("videoQuantity", Math.min(10, form.videoQuantity + 1))}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </BriefSectionCard>
    </>
  );
}
