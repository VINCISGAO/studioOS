import type { Locale } from "@/lib/i18n";

export const MAX_DELIVERABLE_VIDEO_BYTES = 500 * 1024 * 1024;
/** Countdown starts after the brand's first successful final download — not on creator upload. */
export const RETENTION_DAYS_AFTER_BRAND_DOWNLOAD = 7;

export function maxDeliverableVideoLabel(locale: Locale) {
  return locale === "zh" ? "500MB" : "500 MB";
}

export function retentionPeriodLabel(locale: Locale) {
  return locale === "zh" ? "1 个星期（7 天）" : "1 week (7 days)";
}

export function deliverableVideoPolicyNotice(locale: Locale) {
  const period = retentionPeriodLabel(locale);

  if (locale === "zh") {
    return {
      title: "视频存储说明",
      timing:
        "删除倒计时仅在订单完成后、品牌方首次成功下载成品时才开始；创作者上传审片版不会触发删除。",
      body: `平台不长期保留订单成片。自品牌方首次下载成品完成起 ${period} 内，服务器会自动删除该视频文件以释放存储空间，请务必自行备份。您自愿上传至平台的作品集、头像等素材除外，不受此规则影响。`,
      uploadLimit: "单文件最大 500MB，支持 MP4 / MOV。上传不会开始删除倒计时。"
    };
  }

  return {
    title: "Video storage policy",
    timing:
      "The deletion countdown starts only after the brand successfully downloads the final master for a completed order — creator uploads do not start the clock.",
    body: `VINCIS does not keep completed order masters indefinitely. Within ${period} of the brand's first successful final download, the server copy is permanently deleted — save your own backup. Content you voluntarily upload (portfolio, profile assets, etc.) is excluded.`,
    uploadLimit: "Max 500 MB per file · MP4 / MOV. Uploading does not start the retention countdown."
  };
}

export function deliverableDownloadHref(fileUrl: string) {
  const trimmed = fileUrl.trim();
  if (!trimmed.startsWith("/api/review-video/")) {
    return "";
  }
  return trimmed.includes("?") ? `${trimmed}&download=1` : `${trimmed}?download=1`;
}

export function isDeliverableVideoPurged(deliverable: { file_url: string }) {
  return !deliverable.file_url.trim();
}
